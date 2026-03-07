import type { LoaiHopDong, TrangThaiHopDong } from './constants';

/** Bản ghi hợp đồng lao động (liên kết ứng viên). */
export interface HopDong {
  id: string;
  id_ung_vien: string;
  loai_hop_dong: LoaiHopDong;
  so_hop_dong: string;
  ngay_bat_dau: string;
  ngay_ket_thuc?: string | null;
  /** Id HĐ thử việc khi HĐ chính thức được tạo từ thử việc */
  id_hop_dong_goc?: string | null;
  bac_luong?: string | null;
  muc_luong?: string | null;
  ngay_vao_lam?: string | null;
  co_che_khac?: string | null;
  ghi_chu?: string | null;
  ghi_chu_khac?: string | null;
  trang_thai: TrangThaiHopDong;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Enrich từ UngVien */
  ten_ung_vien?: string;
}

/** Phiếu thanh lý hợp đồng. */
export interface PhieuThanhLy {
  id: string;
  id_hop_dong: string;
  so_phieu: string;
  ngay_thanh_ly: string;
  ly_do: string;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

export type { HopDongFormValues, PhieuThanhLyFormValues } from './schema';
