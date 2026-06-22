/** Bảng con `fp_farm_bao_cao_so_che_pham_cap` — lưu tên + 3 số nhập + ghi chú; tổng kg & % tính trên app. */

/** Giới hạn số dòng / phiếu (tránh payload quá lớn). */
export const PHAM_CAP_ROWS_MAX = 50;

/** Thứ tự / tên mặc định 6 dòng phẩm cấp. */
export const PHAM_CAP_PRESETS: readonly { ten: string }[] = [
  { ten: 'Nải' },
  { ten: 'CP' },
  { ten: 'CL' },
  { ten: 'Nội địa' },
  { ten: 'Nội địa 8kg' },
  { ten: '18KG' },
] as const;

/** Dữ liệu nhập form / lưu DB. */
export interface PhamCapRowFormValues {
  ten_pham_cap: string;
  /** Kg mỗi thùng (trước đây cột “Số” / `so_tham_chieu`). */
  so_tham_chieu: number;
  so_thung: number;
  so_thung_quy_doi: number;
  ghi_chu: string;
}

export function emptyPhamCapRow(): PhamCapRowFormValues {
  return {
    ten_pham_cap: '',
    so_tham_chieu: 0,
    so_thung: 0,
    so_thung_quy_doi: 0,
    ghi_chu: '',
  };
}

/** 6 dòng mặc định (Nải, CP, CL, Nội địa, Nội địa 8kg, 18KG) — form mới và phiếu DB chưa có dòng. */
export function defaultPhamCapRows(): PhamCapRowFormValues[] {
  return PHAM_CAP_PRESETS.map((p) => ({
    ten_pham_cap: p.ten,
    so_tham_chieu: 0,
    so_thung: 0,
    so_thung_quy_doi: 0,
    ghi_chu: '',
  }));
}

/** Giữ tên export cũ: mặc định = 6 dòng preset (không còn mảng rỗng). */
export function emptyPhamCapRows(): PhamCapRowFormValues[] {
  return defaultPhamCapRows();
}

export interface FarmBaoCaoSoChePhamCapRow extends PhamCapRowFormValues {
  id?: string;
  id_bao_cao?: string;
  thu_tu: number;
}

/** 6 dòng mặc định cho model/API (phiếu chưa có bản ghi `pham_cap`). */
export function defaultPhamCapModelRows(): FarmBaoCaoSoChePhamCapRow[] {
  return PHAM_CAP_PRESETS.map((p, idx) => ({
    ten_pham_cap: p.ten,
    so_tham_chieu: 0,
    so_thung: 0,
    so_thung_quy_doi: 0,
    ghi_chu: '',
    thu_tu: idx + 1,
  }));
}

/** Chuẩn hoá từ model (đã map từ DB) → form. */
export function normalizePhamCapFromDb(
  rows: FarmBaoCaoSoChePhamCapRow[] | undefined | null
): PhamCapRowFormValues[] {
  const list = [...(rows ?? [])].sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0));
  if (list.length === 0) return defaultPhamCapRows();
  return list.map((r) => ({
    ten_pham_cap: typeof r.ten_pham_cap === 'string' ? r.ten_pham_cap : '',
    so_tham_chieu: Number(r.so_tham_chieu) || 0,
    so_thung: Number(r.so_thung) || 0,
    so_thung_quy_doi: Number(r.so_thung_quy_doi) || 0,
    ghi_chu: typeof r.ghi_chu === 'string' ? r.ghi_chu : '',
  }));
}

/** Suy kg/thùng: ưu tiên `so_tham_chieu`; dữ liệu cũ = tổng kg ÷ số thùng. */
export function inferSoThamChieuKgPerThung(
  row: Pick<PhamCapRowFormValues, 'so_tham_chieu' | 'so_thung'>,
  legacyTongKg?: number
): number {
  const ref = Number(row.so_tham_chieu) || 0;
  if (ref > 0) return ref;
  const thung = Number(row.so_thung) || 0;
  const tongKg = Number(legacyTongKg) || 0;
  if (thung > 0 && tongKg > 0) return tongKg / thung;
  return 0;
}

export { sumPhamCapDisplayTotals as sumPhamCapTotals } from './pham-cap-derived';

/** Chuẩn hoá tên phẩm cấp để ghép với phiếu nhập kho. */
export function normalizePhamCapKey(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/** Tra SL phiếu nhập theo tên phẩm cấp; `undefined` = không có dữ liệu đối chiếu. */
export function lookupPhieuNhapSoLuong(
  map: Record<string, number> | undefined,
  tenPhamCap: string | null | undefined
): number | undefined {
  if (!map) return undefined;
  const key = normalizePhamCapKey(tenPhamCap);
  if (!key) return undefined;
  return key in map ? map[key] : undefined;
}

/** Tổng SL phiếu nhập cho các dòng có tên phẩm cấp khớp map. */
export function sumPhieuNhapRefForRows(
  map: Record<string, number> | undefined,
  rows: Pick<PhamCapRowFormValues, 'ten_pham_cap'>[]
): number {
  if (!map) return 0;
  const seen = new Set<string>();
  let total = 0;
  for (const row of rows) {
    const key = normalizePhamCapKey(row.ten_pham_cap);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (key in map) total += map[key];
  }
  return total;
}
