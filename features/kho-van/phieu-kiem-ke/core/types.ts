/** Dòng chi tiết phiếu kiểm kê: một hàng hóa + số lượng sổ, thực tế, chênh lệch. */
export interface PhieuKiemKeChiTiet {
  id: string;
  id_phieu_kiem_ke: string;
  id_hang_hoa: string;
  so_luong_so: number;
  so_luong_thuc_te?: number | null;
  chenh_lech?: number | null;
  don_vi_tinh?: string;
  ghi_chu?: string;
  ma_hang?: string;
  ten_hang?: string;
}

export interface PhieuKiemKe {
  id: string;
  so_phieu: string;
  ngay: string;
  id_kho: string;
  ten_kho?: string;
  id_nguoi_thuc_hien: string;
  ten_nguoi_thuc_hien?: string;
  id_nguoi_duyet?: string | null;
  ten_nguoi_duyet?: string | null;
  ghi_chu?: string;
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet?: PhieuKiemKeChiTiet[];
}
