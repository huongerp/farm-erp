import type { TrangThaiHopDong } from './constants';

export interface HopDongChiTiet {
  id: string;
  id_hop_dong: string;
  ngay: string | null;
  ten_dot: string | null;
  so_tien: number | null;
  so_cay_thuc_nhan: number | null;
  ghi_chu: string | null;
  id_chi_nhanh: string | null;
  ten_chi_nhanh?: string | null;
  id_nguoi_tao: string | null;
  ten_nguoi_tao?: string | null;
  tg_tao: string | null;
  tg_cap_nhat: string | null;
}

export interface HopDong {
  id: string;
  ngay: string | null;
  id_nha_cung_cap: string;
  ten_nha_cung_cap?: string | null;
  ma_hop_dong: string;
  ten_hop_dong: string | null;
  noi_dung: string | null;
  so_luong_cay: number | null;
  don_gia: number | null;
  thanh_tien: number | null;
  trang_thai: TrangThaiHopDong;
  ghi_chu: string | null;
  id_nguoi_tao: string | null;
  ten_nguoi_tao?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  /** Từ view summary */
  tong_da_thanh_toan?: number | null;
  so_dot_thanh_toan?: number | null;
  tong_cay_da_giao?: number | null;
  tien_con_lai?: number | null;
  cay_con_lai?: number | null;
  chi_tiet?: HopDongChiTiet[];
}

export interface HopDongFilters {
  trangThai: string[];
  nccIds: string[];
  dateFrom: string;
  dateTo: string;
  nguoiTaoIds: string[];
}

/** Dòng thanh toán kèm thông tin hợp đồng cha (tab Thanh toán) */
export interface HopDongChiTietEnriched extends HopDongChiTiet {
  ma_hop_dong?: string | null;
  ten_hop_dong?: string | null;
  ten_nha_cung_cap?: string | null;
  id_nha_cung_cap?: string | null;
  trang_thai_hop_dong?: string | null;
}

export interface ThanhToanFilters {
  chiNhanhIds: string[];
  nccIds: string[];
  hopDongIds: string[];
  dateFrom: string;
  dateTo: string;
  nguoiTaoIds: string[];
}

export interface BaoCaoFilters {
  trangThai: string[];
  nccIds: string[];
  dateFrom: string;
  dateTo: string;
}
