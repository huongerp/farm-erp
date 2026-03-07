import type { TrangThai } from '../../../../lib/constants';

/** Phòng ban – 1 cấp, đồng bộ bảng fp_var_phong_ban (Supabase) */
export interface Department {
  id: string;
  ten_phong_ban: string;
  chuc_nang: string | null;
  tt: number;
  trang_thai: TrangThai;
  tg_tao: string;
  tg_cap_nhat: string | null;
}

export interface DepartmentFormState {
  ten_phong_ban: string;
  chuc_nang: string | null;
  tt: number;
  trang_thai: TrangThai;
}
