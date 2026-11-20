import type { FarmBaoCaoSoChePhamCapRow, PhamCapRowFormValues } from './pham-cap';

const EPS = 1e-9;

/** Làm tròn 4 chữ số thập phân (độ chính xác cột DB) — tránh 151 × 1,2 = 181,20000000000002. */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Tổng kg dòng = số thùng × kg/thùng (`so_tham_chieu`). */
export function phamCapTongKgRow(row: Pick<PhamCapRowFormValues, 'so_thung' | 'so_tham_chieu'>): number {
  const thung = Number(row.so_thung) || 0;
  const kgPerThung = Number(row.so_tham_chieu) || 0;
  return thung > 0 && kgPerThung > 0 ? thung * kgPerThung : 0;
}

/**
 * Tổng quy đổi dòng (số thùng): có hệ số → số thùng × hệ số;
 * hệ số trống (phiếu cũ nhập tay) → giữ `so_thung_quy_doi` đã lưu.
 */
export function phamCapTongQuyDoiRow(
  row: Pick<PhamCapRowFormValues, 'so_thung' | 'so_thung_quy_doi' | 'he_so_quy_doi'>
): number {
  const heSoRaw = row.he_so_quy_doi;
  if (heSoRaw != null && (heSoRaw as unknown) !== '') {
    const heSo = Number(heSoRaw);
    if (Number.isFinite(heSo) && heSo >= 0) return round4((Number(row.so_thung) || 0) * heSo);
  }
  return Number(row.so_thung_quy_doi) || 0;
}

export interface PhamCapRowDerived extends PhamCapRowFormValues {
  tong_kg: number;
  ty_le_pct: number;
  /** = `phamCapTongQuyDoiRow` — dùng thay `so_thung_quy_doi` khi hiển thị. */
  tong_quy_doi: number;
}

export function enrichPhamCapRowsWithDerived<T extends PhamCapRowFormValues>(
  rows: T[]
): (T & PhamCapRowDerived)[] {
  const tongKgNgay = rows.reduce((s, r) => s + phamCapTongKgRow(r), 0);
  return rows.map((r) => {
    const tong_kg = phamCapTongKgRow(r);
    const ty_le_pct = tongKgNgay > EPS ? (tong_kg / tongKgNgay) * 100 : 0;
    return { ...r, tong_kg, ty_le_pct, tong_quy_doi: phamCapTongQuyDoiRow(r) };
  });
}

export function sumPhamCapDisplayTotals(rows: PhamCapRowFormValues[] | FarmBaoCaoSoChePhamCapRow[]) {
  const formRows: PhamCapRowFormValues[] = rows.map((r) => ({
    ten_pham_cap: r.ten_pham_cap,
    so_tham_chieu: Number(r.so_tham_chieu) || 0,
    so_thung: Number(r.so_thung) || 0,
    so_thung_quy_doi: Number(r.so_thung_quy_doi) || 0,
    he_so_quy_doi: r.he_so_quy_doi ?? null,
    ghi_chu: typeof r.ghi_chu === 'string' ? r.ghi_chu : '',
  }));
  const enriched = enrichPhamCapRowsWithDerived(formRows);
  const tong_kg = enriched.reduce((s, r) => s + r.tong_kg, 0);
  return {
    so_thung: enriched.reduce((s, r) => s + (Number(r.so_thung) || 0), 0),
    tong_kg,
    ty_le_pct: tong_kg > EPS ? 100 : 0,
    so_thung_quy_doi: round4(enriched.reduce((s, r) => s + r.tong_quy_doi, 0)),
  };
}
