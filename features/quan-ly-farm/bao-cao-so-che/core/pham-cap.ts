/** Bảng con `fp_farm_bao_cao_so_che_pham_cap` — chỉ lưu tên + 3 số nhập; tổng kg & % tính trên app. */

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
}

export function emptyPhamCapRow(): PhamCapRowFormValues {
  return {
    ten_pham_cap: '',
    so_tham_chieu: 0,
    so_thung: 0,
    so_thung_quy_doi: 0,
  };
}

/** 6 dòng mặc định (Nải, CP, CL, Nội địa, Nội địa 8kg, 18KG) — form mới và phiếu DB chưa có dòng. */
export function defaultPhamCapRows(): PhamCapRowFormValues[] {
  return PHAM_CAP_PRESETS.map((p) => ({
    ten_pham_cap: p.ten,
    so_tham_chieu: 0,
    so_thung: 0,
    so_thung_quy_doi: 0,
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
