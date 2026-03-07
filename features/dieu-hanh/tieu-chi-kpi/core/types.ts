/** Loại đo lường: xuôi = cao tốt, ngược = thấp tốt */
export type LoaiDoLuong = 'xuoi' | 'nguoc';

/** Tần suất đo lường */
export type TanSuat = 'thang' | 'quy' | 'nam';

/** Tiêu chí KPI – thuộc một hành động cốt lõi */
export interface TieuChiKpi {
  id: string;
  id_hanh_dong: string;
  ma?: string | null;
  ten: string;
  mo_ta?: string | null;
  don_vi_tinh: string;
  loai: LoaiDoLuong;
  gia_tri_muc_tieu: number;
  gia_tri_toi_thieu?: number | null;
  cach_tinh_diem: string;
  tan_suat: TanSuat;
  ty_trong: number;
  thu_tu?: number | null;
  nguon_du_lieu?: string | null;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Đơn vị tính (master – tab Thiết lập) */
export interface DonViTinh {
  id: string;
  ma: string;
  ten: string;
  ky_hieu?: string | null;
  thu_tu: number;
}

/** Cách tính điểm (master – tab Thiết lập) */
export interface CachTinhDiem {
  id: string;
  ma: string;
  ten: string;
  mo_ta?: string | null;
  thu_tu: number;
}
