/** Dòng chi tiết đơn đặt hàng: một hàng hóa + số lượng + đơn giá. */
export interface DonDatHangChiTiet {
  id: string;
  id_don_dat_hang: string;
  id_hang_hoa: string;
  so_luong: number;
  don_vi_tinh?: string;
  don_gia?: number;
  thanh_tien?: number;
  ghi_chu?: string;
  ten_danh_muc_cap1?: string;
  ten_danh_muc_cap2?: string;
  phan_loai?: string | null;
  /** Mục đích sử dụng (dòng chi tiết). */
  muc_dich_su_dung?: string | null;
  ma_hang?: string;
  ten_hang?: string;
}

/** Trạng thái đơn đặt hàng – text như DB (giống module đề xuất vật tư). */
export const TRANG_THAI_NHAP = 'Nháp';
export const TRANG_THAI_CHO_DUYET = 'Chờ duyệt';
export const TRANG_THAI_DA_GUI = 'Đã gửi';
export const TRANG_THAI_DA_XAC_NHAN = 'Đã xác nhận';
export const TRANG_THAI_DANG_GIAO = 'Đang giao';
export const TRANG_THAI_DA_NHAN_DU = 'Đã nhận đủ';
export const TRANG_THAI_DA_DONG = 'Đã đóng';
export const TRANG_THAI_HUY = 'Hủy';

export type DonDatHangTrangThai =
  | typeof TRANG_THAI_NHAP
  | typeof TRANG_THAI_CHO_DUYET
  | typeof TRANG_THAI_DA_GUI
  | typeof TRANG_THAI_DA_XAC_NHAN
  | typeof TRANG_THAI_DANG_GIAO
  | typeof TRANG_THAI_DA_NHAN_DU
  | typeof TRANG_THAI_DA_DONG
  | typeof TRANG_THAI_HUY;

export interface DonDatHang {
  id: string;
  so_po: string;
  ngay_dat: string;
  ngay_giao_dk: string;
  id_nha_cung_cap: string;
  ten_nha_cung_cap?: string;
  ma_nha_cung_cap?: string;
  id_kho_nhan?: string | null;
  ten_kho_nhan?: string | null;
  id_phieu_de_xuat_vat_tu?: string | null;
  so_phieu_de_xuat?: string | null;
  id_nguoi_dat: string;
  ten_nguoi_dat?: string;
  ma_nguoi_dat?: string;
  id_nguoi_duyet?: string | null;
  ten_nguoi_duyet?: string | null;
  ma_nguoi_duyet?: string | null;
  dieu_khoan_thanh_toan?: string;
  ghi_chu?: string;
  trang_thai: DonDatHangTrangThai;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet?: DonDatHangChiTiet[];
}

/** Một dòng tab "Chi tiết" (view v_don_dat_hang_chi_tiet_flat): header đơn + một dòng hàng. */
export interface ChiTietDonDatHangFlat {
  /** Id dòng chi tiết (unique trong bảng). */
  id: string;
  id_don_dat_hang: string;
  so_po: string;
  ngay_dat: string;
  ngay_giao_dk: string;
  id_nha_cung_cap: string;
  ten_nha_cung_cap?: string;
  ma_nha_cung_cap?: string;
  id_kho_nhan?: string | null;
  ten_kho_nhan?: string | null;
  id_phieu_de_xuat_vat_tu?: string | null;
  so_phieu_de_xuat?: string | null;
  id_nguoi_dat: string;
  ten_nguoi_dat?: string;
  ma_nguoi_dat?: string;
  id_nguoi_duyet?: string | null;
  ten_nguoi_duyet?: string | null;
  ma_nguoi_duyet?: string | null;
  /** Ghi chú trên đơn (header). */
  don_ghi_chu?: string;
  trang_thai: DonDatHangTrangThai;
  don_tg_tao: string;
  don_tg_cap_nhat: string;
  id_hang_hoa: string;
  ten_danh_muc_cap1?: string;
  ten_danh_muc_cap2?: string;
  phan_loai?: string | null;
  muc_dich_su_dung?: string | null;
  ma_hang?: string;
  ten_hang?: string;
  so_luong: number;
  don_gia?: number;
  thanh_tien?: number;
  don_vi_tinh?: string;
  /** Ghi chú dòng chi tiết. */
  ghi_chu?: string;
}
