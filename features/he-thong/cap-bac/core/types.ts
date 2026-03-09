import type { TrangThaiHoatDong } from '../../../../lib/constants';

export interface JobLevel {
  id: string;
  ten_cap_bac: string;
  cap_bac: number;
  mo_ta: string | null;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface JobLevelFormState {
  ten_cap_bac: string;
  cap_bac: number;
  mo_ta: string | null;
  trang_thai: TrangThaiHoatDong;
}
