/** Trạng thái phiếu — DB: fp_farm_dang_ky_nhan_hang.trang_thai */
export const TRANG_THAI_DKNH = ['cho_vao', 'da_vao', 'da_ra', 'huy'] as const;
export type TrangThaiDkNh = (typeof TRANG_THAI_DKNH)[number];

export type NguonDongHang = 'quet' | 'tay';

export interface DangKyNhanHang {
  id: string;
  id_chi_nhanh: string;
  ten_chi_nhanh: string | null;
  /** YYYY-MM-DD */
  ngay_dang_ky: string;
  khach_hang: string | null;
  loai_hang_hoa: string | null;
  so_xe: string | null;
  so_cont: string | null;
  ten_tai_xe: string | null;
  sdt_tai_xe: string | null;
  /** HH:mm */
  gio_dang_ky_tu: string | null;
  /** HH:mm */
  gio_dang_ky_den: string | null;
  /** ISO timestamptz — check in */
  tg_vao_thuc_te: string | null;
  /** ISO timestamptz — check out */
  tg_ra_thuc_te: string | null;
  id_nguoi_check_in: string | null;
  id_nguoi_check_out: string | null;
  ten_nguoi_check_in: string | null;
  ten_nguoi_check_out: string | null;
  trang_thai: TrangThaiDkNh;
  ghi_chu: string | null;
  hinh_anh_urls: string[];
  id_nguoi_tao: string | null;
  ten_nguoi_tao: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Tổng số lượng hàng xuất (view tổng) — 0 khi phiếu chỉ đăng ký xe. */
  tong_so_luong: number;
}

/** Một dòng hàng xuất — mỗi thùng quét QR là 1 dòng. */
export interface DangKyNhanHangCt {
  id: string;
  id_phieu: string;
  id_hang_hoa: string;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  so_luong: number;
  nguon: NguonDongHang;
  tg_quet: string;
  id_nguoi_quet: string | null;
  ten_nguoi_quet: string | null;
}

/** View v_farm_dang_ky_nhan_hang_tong_hh */
export interface TongHangHoaPhieu {
  id_phieu: string;
  id_hang_hoa: string;
  ma_hang_hoa: string | null;
  ten_hang_hoa: string | null;
  dvt: string | null;
  so_dong: number;
  tong_so_luong: number;
}
