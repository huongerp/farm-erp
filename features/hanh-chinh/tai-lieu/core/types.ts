/** Hướng tài liệu: nội bộ, đến, đi */
export type HuongTaiLieu = 'noi_bo' | 'den' | 'di';

export interface TaiLieu {
  id: string;
  /** Mã số tài liệu (định danh riêng) */
  ma_so?: string;
  huong: HuongTaiLieu;
  /** Loại tài liệu (id từ thiet-lap-tai-lieu) */
  id_loai: string;
  ten_loai?: string;
  ma_loai?: string;
  /** Nhóm tài liệu (phân loại) */
  id_nhom_tai_lieu?: string;
  ten_nhom_tai_lieu?: string;
  /** Trạng thái (id từ thiet-lap-tai-lieu) */
  id_trang_thai: string;
  ten_trang_thai?: string;
  /** Màu trạng thái (hex, từ cấu hình) */
  mau_trang_thai?: string;
  trich_yeu: string;
  /** Văn bản đến: số đến, ngày đến, nơi gửi */
  so_den?: string;
  ngay_den?: string;
  noi_gui?: string;
  /** Văn bản đi: số đi, ngày ký, nơi nhận */
  so_di?: string;
  ngay_ky?: string;
  noi_nhan?: string;
  /** Phòng quản lý */
  id_phong_ban?: string;
  ten_phong_ban?: string;
  /** Chức vụ được xem (phân quyền) */
  id_chuc_vu_xem?: string[];
  ghi_chu?: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface TaiLieuFormState {
  ma_so?: string;
  huong: HuongTaiLieu;
  id_loai: string;
  id_nhom_tai_lieu?: string;
  id_trang_thai: string;
  trich_yeu: string;
  so_den?: string;
  ngay_den?: string;
  noi_gui?: string;
  so_di?: string;
  ngay_ky?: string;
  noi_nhan?: string;
  id_phong_ban?: string;
  ghi_chu?: string;
}
