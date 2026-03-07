import type { TrangThaiNV } from '../../../../lib/constants';

export type Gender = 'Nam' | 'Nữ' | 'Khác';

export interface Employee {
  id: string;
  ma_nhan_vien: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;

  id_phong_ban: string | null;
  id_chuc_vu: string | null;
  id_chi_nhanh?: string | null;

  ten_phong_ban?: string;
  ten_chuc_vu?: string;
  ten_chi_nhanh?: string;

  gioi_tinh: Gender;
  trang_thai: TrangThaiNV;
  ngay_vao_lam: string;
  anh_dai_dien?: string;

  ngay_sinh?: string;
  cmnd_cccd?: string;
  ngay_cap_cccd?: string;
  noi_cap_cccd?: string;
  quoc_tich?: string;
  dan_toc?: string;
  ton_giao?: string;

  tinh_thanh?: string;
  quan_huyen?: string;
  phuong_xa?: string;
  dia_chi_cu_the?: string;
  dia_chi_tam_tru?: string;

  id_cap_bac?: string | null;
  ten_cap_bac?: string;
  cap_bac?: number | null;
  loai_hop_dong?: string;
  ngay_het_han_hd?: string | null;
  noi_lam_viec?: string;

  nguoi_lien_he_khan_cap?: string;
  sdt_khan_cap?: string;
  quan_he_khan_cap?: string;

  tinh_trang_hon_nhan?: string;
  so_nguoi_phu_thuoc?: number;

  trinh_do_hoc_van?: string;
  chuyen_nganh?: string;
  truong_hoc?: string;
  nam_tot_nghiep?: string;
  chung_chi?: string;

  so_tai_khoan?: string;
  ten_ngan_hang?: string;
  chi_nhanh_nh?: string;
  ma_so_thue_ca_nhan?: string;

  so_bhxh?: string;
  so_bhyt?: string;
  ngay_tham_gia_bh?: string;
  noi_dang_ky_kcb?: string;
}

export interface EmployeeFilters {
  trang_thai: string[];
  id_phong_ban: string[];
  gender: string[];
  position: string[];
}
