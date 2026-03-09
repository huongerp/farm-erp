import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Chức vụ – đồng bộ bảng fp_var_chuc_vu (Supabase). Liên kết fp_var_phong_ban, fp_var_cap_bac. */
export interface Position {
  id: string;
  ten_chuc_vu: string;
  /** Không lưu DB (bảng không có cột ma_chuc_vu); giữ optional cho hiển thị cũ. */
  ma_chuc_vu?: string;

  phong_ban_id?: string | null;
  cap_bac_id?: string | null;
  ten_phong_ban?: string;
  ten_cap_bac?: string;
  /** Số cấp bậc (từ fp_var_cap_bac.cap_bac), ví dụ 1 = Giám đốc */
  cap_bac?: number;

  mo_ta: string | null;
  tt: number;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface PositionFormState {
  ten_chuc_vu: string;
  phong_ban_id?: string;
  cap_bac_id?: string;
  mo_ta: string | null;
  tt: number;
  trang_thai: TrangThaiHoatDong;
}
