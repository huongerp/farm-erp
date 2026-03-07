import type { AdminFormType } from './constants';

export interface PayrollWifiIp {
  id: string;
  id_chi_nhanh: string;
  ten_chi_nhanh?: string;
  ip_wifi: string;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface PayrollWifiIpFormState {
  id_chi_nhanh: string;
  ip_wifi: string;
  ghi_chu?: string;
  trang_thai: number;
}

export interface PayrollAdminFormGroup {
  id: string;
  loai_phieu: AdminFormType;
  so_luong_thang: number;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface PayrollAdminFormGroupFormState {
  loai_phieu: AdminFormType | '';
  so_luong_thang: number;
  ghi_chu?: string;
  trang_thai: number;
}

/** Loại hạng mục điểm cộng trừ */
export type PointGroupType = 'cong' | 'tru';

export interface PayrollPointGroup {
  id: string;
  ma: string;
  ten: string;
  loai: PointGroupType;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface PayrollPointGroupFormState {
  ma: string;
  ten: string;
  loai: PointGroupType | '';
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: number;
}
