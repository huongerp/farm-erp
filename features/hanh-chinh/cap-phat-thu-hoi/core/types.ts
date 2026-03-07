/**
 * Loại phiếu: Cấp phát, Thu hồi, Luân chuyển vị trí, Luân chuyển người quản lý, Luân chuyển cả 2.
 */
export type LoaiPhieu =
  | 'cap_phat'
  | 'thu_hoi'
  | 'luan_chuyen_vi_tri'
  | 'luan_chuyen_nguoi'
  | 'luan_chuyen_ca_hai';

/** Phiếu cấp phát / thu hồi / luân chuyển – lịch sử thay đổi nơi lưu và người giữ tài sản */
export interface PhieuCapPhatThuHoi {
  id: string;
  loai_phieu: LoaiPhieu;
  id_tai_san: string;
  ma_tai_san?: string;
  ten_tai_san?: string;
  /** Nơi lưu trước (để hiển thị) */
  id_noi_luu_truoc: string;
  ten_noi_luu_truoc?: string;
  /** Nơi lưu sau */
  id_noi_luu_sau: string;
  ten_noi_luu_sau?: string;
  /** Người giữ trước (null = kho) */
  id_nguoi_giu_truoc?: string | null;
  ten_nguoi_giu_truoc?: string | null;
  ma_nguoi_giu_truoc?: string | null;
  /** Người giữ sau */
  id_nguoi_giu_sau?: string | null;
  ten_nguoi_giu_sau?: string | null;
  ma_nguoi_giu_sau?: string | null;
  ngay_thuc_hien: string;
  id_nguoi_thuc_hien: string;
  ten_nguoi_thuc_hien?: string | null;
  ghi_chu?: string | null;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Payload tạo phiếu – các trường bắt buộc/tùy chọn theo loại */
export interface PhieuCapPhatThuHoiCreate {
  loai_phieu: LoaiPhieu;
  id_tai_san: string;
  id_noi_luu_truoc: string;
  id_noi_luu_sau: string;
  id_nguoi_giu_truoc?: string | null;
  id_nguoi_giu_sau?: string | null;
  ngay_thuc_hien: string;
  id_nguoi_thuc_hien: string;
  ghi_chu?: string | null;
}
