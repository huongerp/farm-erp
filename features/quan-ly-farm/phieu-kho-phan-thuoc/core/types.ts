/** Loại phiếu lưu DB – tiếng Việt có dấu. */
export type LoaiPhieuKhoPT = 'nhập' | 'xuất' | 'chuyển';

/** Trạng thái phiếu – text lưu DB. */
export type TrangThaiPhieuKhoPT = 'Chờ duyệt' | 'Đã duyệt' | 'Không duyệt';

export const TRANG_THAI_PHIEU_KHO_PT: Record<number, TrangThaiPhieuKhoPT> = {
  0: 'Chờ duyệt',
  1: 'Đã duyệt',
  2: 'Không duyệt',
};

export const TRANG_THAI_PHIEU_KHO_PT_TO_NUM: Record<TrangThaiPhieuKhoPT, number> = {
  'Chờ duyệt': 0,
  'Đã duyệt': 1,
  'Không duyệt': 2,
};

/** Dòng chi tiết — khớp fp_farm_phieu_kho_phan_thuoc_chi_tiet. */
export interface PhieuKhoPTChiTiet {
  id: string;
  id_phieu_kho: string;
  id_hang_hoa: string;
  ten_hang_hoa?: string;
  so_luong: number;
  don_gia?: number;
  thanh_tien?: number;
  don_vi_tinh?: string;
  so_lot?: string;
  ghi_chu?: string;
  nguoi_tao_id?: number | null;
  ten_nguoi_tao?: string;
  tg_tao?: string;
  tg_cap_nhat?: string;
  ma_hang?: string;
  ten_hang?: string;
  ten_danh_muc?: string;
}

export interface PhieuKhoPT {
  id: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKhoPT;
  kho_id: string;
  ten_kho?: string;
  kho_den_id?: string | null;
  ten_kho_den?: string;
  trang_thai: TrangThaiPhieuKhoPT;
  mo_ta?: string;
  trao_doi?: string;
  id_nguoi_duyet?: number | null;
  ten_nguoi_duyet?: string;
  nguoi_tao_id?: number | null;
  ten_nguoi_tao?: string;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet?: PhieuKhoPTChiTiet[];
  tong_so_dong?: number;
  tong_so_luong?: number;
  tong_tien?: number;
}

/** Một dòng tab Chi tiết (phiếu + dòng hàng). */
export interface ChiTietPhieuKhoPTFlat {
  id: string;
  id_phieu_kho: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKhoPT;
  kho_id: string;
  ten_kho?: string;
  kho_den_id?: string | null;
  ten_kho_den?: string;
  trang_thai: TrangThaiPhieuKhoPT;
  mo_ta?: string;
  trao_doi?: string;
  phieu_tg_tao?: string;
  phieu_tg_cap_nhat?: string;
  id_nguoi_duyet?: number | null;
  ten_nguoi_duyet?: string;
  nguoi_tao_id?: number | null;
  ten_nguoi_tao?: string;
  id_hang_hoa: string;
  ten_hang_hoa?: string;
  ma_hang?: string;
  ten_hang?: string;
  so_luong: number;
  don_gia?: number;
  thanh_tien?: number;
  don_vi_tinh?: string;
  so_lot?: string;
  ghi_chu?: string;
  chi_tiet_nguoi_tao_id?: number | null;
  chi_tiet_ten_nguoi_tao?: string;
  chi_tiet_tg_tao?: string;
  chi_tiet_tg_cap_nhat?: string;
}
