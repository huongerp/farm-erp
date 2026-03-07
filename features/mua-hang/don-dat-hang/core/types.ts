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
  ma_hang?: string;
  ten_hang?: string;
}

/** Trạng thái: 0=Nháp, 1=Chờ duyệt, 2=Đã gửi, 3=Đã xác nhận, 4=Đang giao, 5=Đã nhận đủ, 6=Đã đóng, 7=Hủy */
export type DonDatHangTrangThai = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
