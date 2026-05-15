/** Bảng con `fp_farm_bao_cao_so_che_pham_cap` — nhiều dòng / phiếu, tên loại do người dùng. */

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

export interface PhamCapRowFormValues {
  ten_pham_cap: string;
  so_tham_chieu: number;
  so_thung: number;
  so_kg: number;
  ty_le_pct: number;
  so_thung_quy_doi: number;
}

export function emptyPhamCapRow(): PhamCapRowFormValues {
  return {
    ten_pham_cap: '',
    so_tham_chieu: 0,
    so_thung: 0,
    so_kg: 0,
    ty_le_pct: 0,
    so_thung_quy_doi: 0,
  };
}

/** 6 dòng mặc định (Nải, CP, CL, Nội địa, Nội địa 8kg, 18KG) — form mới và phiếu DB chưa có dòng. */
export function defaultPhamCapRows(): PhamCapRowFormValues[] {
  return PHAM_CAP_PRESETS.map((p) => ({
    ten_pham_cap: p.ten,
    so_tham_chieu: 0,
    so_thung: 0,
    so_kg: 0,
    ty_le_pct: 0,
    so_thung_quy_doi: 0,
  }));
}

/** Giữ tên export cũ: mặc định = 6 dòng preset (không còn mảng rỗng). */
export function emptyPhamCapRows(): PhamCapRowFormValues[] {
  return defaultPhamCapRows();
}

export interface FarmBaoCaoSoChePhamCapRow {
  id?: string;
  id_bao_cao?: string;
  ten_pham_cap: string;
  so_tham_chieu: number;
  so_thung: number;
  so_kg: number;
  ty_le_pct: number;
  so_thung_quy_doi: number;
  thu_tu: number;
}

/** 6 dòng mặc định cho model/API (phiếu chưa có bản ghi `pham_cap`). */
export function defaultPhamCapModelRows(): FarmBaoCaoSoChePhamCapRow[] {
  return PHAM_CAP_PRESETS.map((p, idx) => ({
    ten_pham_cap: p.ten,
    so_tham_chieu: 0,
    so_thung: 0,
    so_kg: 0,
    ty_le_pct: 0,
    so_thung_quy_doi: 0,
    thu_tu: idx + 1,
  }));
}

export function normalizePhamCapFromDb(rows: FarmBaoCaoSoChePhamCapRow[] | undefined | null): PhamCapRowFormValues[] {
  const list = [...(rows ?? [])].sort((a, b) => (a.thu_tu ?? 0) - (b.thu_tu ?? 0));
  if (list.length === 0) return defaultPhamCapRows();
  return list.map((r) => ({
    ten_pham_cap: typeof r.ten_pham_cap === 'string' ? r.ten_pham_cap : '',
    so_tham_chieu: Number(r.so_tham_chieu) || 0,
    so_thung: Number(r.so_thung) || 0,
    so_kg: Number(r.so_kg) || 0,
    ty_le_pct: Number(r.ty_le_pct) || 0,
    so_thung_quy_doi: Number(r.so_thung_quy_doi) || 0,
  }));
}

/** Tổng cộng hiển thị (không lưu DB). */
export function sumPhamCapTotals(rows: PhamCapRowFormValues[] | FarmBaoCaoSoChePhamCapRow[]) {
  let so_thung = 0;
  let so_kg = 0;
  let ty_le_pct = 0;
  let so_thung_quy_doi = 0;
  for (const r of rows) {
    so_thung += Number(r.so_thung) || 0;
    so_kg += Number(r.so_kg) || 0;
    ty_le_pct += Number(r.ty_le_pct) || 0;
    so_thung_quy_doi += Number(r.so_thung_quy_doi) || 0;
  }
  return { so_thung, so_kg, ty_le_pct, so_thung_quy_doi };
}
