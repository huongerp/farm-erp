import type { PhieuChecklist } from './types';

/** Đếm kết quả khâu làm của một phiếu (hiện cột "Đạt/K.Đạt" trên danh sách). */
export interface DemKetQuaThucHien {
  dat: number;
  khongDat: number;
}

/**
 * Dòng danh sách phiếu — kèm tên chi nhánh (embed PostgREST), tên người tạo / người nhận (enrich)
 * + đếm kết quả khâu làm.
 */
export interface PhieuChecklistListItem extends PhieuChecklist {
  ten_chi_nhanh: string | null;
  ten_nguoi_tao: string | null;
  ten_nguoi_nhan: string | null;
  kqThucHien: DemKetQuaThucHien;
}
