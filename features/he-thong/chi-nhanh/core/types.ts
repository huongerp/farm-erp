import type { TrangThai } from '../../../../lib/constants';

export interface Branch {
  id: string;
  ma_chi_nhanh: string;
  ten_chi_nhanh: string;
  dia_chi: string;
  tinh_thanh: string;
  quan_huyen: string;
  vi_do: number | null;
  kinh_do: number | null;
  duong_dan_map?: string | null;
  trang_thai: TrangThai;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface BranchFormState {
  ma_chi_nhanh: string;
  ten_chi_nhanh: string;
  dia_chi: string;
  tinh_thanh: string;
  quan_huyen: string;
  vi_do: number | null;
  kinh_do: number | null;
  duong_dan_map?: string | null;
  trang_thai: TrangThai;
}
