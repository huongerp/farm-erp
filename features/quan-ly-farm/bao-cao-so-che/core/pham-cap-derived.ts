import type { FarmBaoCaoSoChePhamCapRow, PhamCapRowFormValues } from './pham-cap';

const EPS = 1e-9;

/** Tổng kg dòng = số thùng × kg/thùng (`so_tham_chieu`). */
export function phamCapTongKgRow(row: Pick<PhamCapRowFormValues, 'so_thung' | 'so_tham_chieu'>): number {
  const thung = Number(row.so_thung) || 0;
  const kgPerThung = Number(row.so_tham_chieu) || 0;
  return thung > 0 && kgPerThung > 0 ? thung * kgPerThung : 0;
}

export interface PhamCapRowDerived extends PhamCapRowFormValues {
  tong_kg: number;
  ty_le_pct: number;
}

export function enrichPhamCapRowsWithDerived<T extends PhamCapRowFormValues>(
  rows: T[]
): (T & PhamCapRowDerived)[] {
  const tongKgNgay = rows.reduce((s, r) => s + phamCapTongKgRow(r), 0);
  return rows.map((r) => {
    const tong_kg = phamCapTongKgRow(r);
    const ty_le_pct = tongKgNgay > EPS ? (tong_kg / tongKgNgay) * 100 : 0;
    return { ...r, tong_kg, ty_le_pct };
  });
}

/** Tỷ lệ thu hồi KPI (%) = Tổng số thùng quy đổi ÷ Tổng số thùng × 100. */
export function computeTyLeThuHoiPctFromPhamCap(
  totals: Pick<ReturnType<typeof sumPhamCapDisplayTotals>, 'so_thung_quy_doi' | 'so_thung'>
): number | null {
  const tongThung = Number(totals.so_thung) || 0;
  const tongThungQD = Number(totals.so_thung_quy_doi) || 0;
  if (tongThung <= EPS) return null;
  return (tongThungQD / tongThung) * 100;
}

export function sumPhamCapDisplayTotals(rows: PhamCapRowFormValues[] | FarmBaoCaoSoChePhamCapRow[]) {
  const formRows: PhamCapRowFormValues[] = rows.map((r) => ({
    ten_pham_cap: r.ten_pham_cap,
    so_tham_chieu: Number(r.so_tham_chieu) || 0,
    so_thung: Number(r.so_thung) || 0,
    so_thung_quy_doi: Number(r.so_thung_quy_doi) || 0,
    ghi_chu: typeof r.ghi_chu === 'string' ? r.ghi_chu : '',
  }));
  const enriched = enrichPhamCapRowsWithDerived(formRows);
  const tong_kg = enriched.reduce((s, r) => s + r.tong_kg, 0);
  return {
    so_thung: enriched.reduce((s, r) => s + (Number(r.so_thung) || 0), 0),
    tong_kg,
    ty_le_pct: tong_kg > EPS ? 100 : 0,
    so_thung_quy_doi: enriched.reduce((s, r) => s + (Number(r.so_thung_quy_doi) || 0), 0),
  };
}
