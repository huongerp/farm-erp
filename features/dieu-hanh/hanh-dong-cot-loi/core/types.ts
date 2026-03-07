/** BSC (Balanced Scorecard) – 4 hạng mục cố định */
export type BscDimension =
  | 'tai_chinh'
  | 'khach_hang'
  | 'quy_trinh'
  | 'hoc_hoi_phat_trien';

/** Hành động cốt lõi – thuộc một chiến lược đã duyệt */
export interface HanhDongCotLoi {
  id: string;
  id_chien_luoc: string;
  ma?: string | null;
  ten: string;
  mo_ta?: string | null;
  bsc_dimension: BscDimension;
  nhom_hanh_dong: string;
  ty_trong: number;
  thu_tu?: number | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Nhóm hành động (master data – tab Thiết lập) */
export interface NhomHanhDong {
  id: string;
  ma: string;
  ten: string;
  mo_ta?: string | null;
  thu_tu: number;
}
