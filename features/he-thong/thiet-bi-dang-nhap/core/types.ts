import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Phiên đăng nhập trên thiết bị - quản lý tài khoản đã đăng nhập trên những thiết bị nào */

export interface LoginDevice {
  id: string;
  id_user: string;
  ten_user: string;
  email_user: string;

  /** Tên mô tả thiết bị (VD: Chrome trên Windows) */
  ten_thiet_bi: string;
  /** desktop | mobile | tablet */
  loai_thiet_bi: 'desktop' | 'mobile' | 'tablet';
  /** Chrome, Safari, Firefox, ... */
  trinh_duyet: string;
  /** Windows, macOS, iOS, Android, ... */
  he_dieu_hanh: string;
  dia_chi_ip: string;

  /** Thời gian đăng nhập gần nhất */
  tg_dang_nhap_cuoi: string;
  /** true = thiết bị hiện tại đang xem trang này */
  la_thiet_bi_hien_tai: boolean;

  /** Đang hoạt động | Ngừng hoạt động (lưu text trong DB) */
  trang_thai: TrangThaiHoatDong;

  tg_tao?: string;
  tg_cap_nhat?: string;
}

export interface LoginDeviceFilters {
  /** Trạng thái: ['Active','Inactive'] hoặc [] = tất cả */
  status: string[];
}
