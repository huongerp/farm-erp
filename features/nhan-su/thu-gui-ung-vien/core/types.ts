import type { LoaiThuSlug } from './constants';

/** Bản ghi thư gửi ứng viên (bảng con so với module Ứng viên). */
export interface ThuGuiUngVien {
  id: string;
  id_ung_vien: string;
  /** tu-choi | moi-nhan-viec */
  loai_thu: LoaiThuSlug;
  ghi_chu?: string | null;
  /** Dùng cho thư mời nhận việc */
  ngay_vao_lam?: string | null;
  /** Chỉ thư mời nhận việc: bậc lương (tên hoặc mã) */
  bac_luong?: string | null;
  /** Chỉ thư mời nhận việc: mức lương hiển thị in phiếu */
  muc_luong?: string | null;
  /** Chỉ thư mời nhận việc: cơ chế khác (phụ cấp, thưởng, BHXH...) */
  co_che_khac?: string | null;
  /** Chỉ thư mời nhận việc: ghi chú khác */
  ghi_chu_khac?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Enrich từ UngVien */
  ten_ung_vien?: string;
}

export type { ThuGuiUngVienFormValues } from './schema';
