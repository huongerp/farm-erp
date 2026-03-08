import type { TrangThaiHoatDong } from '../../../../lib/constants';

export interface DuAn {
  id: string;
  ma_du_an: string;
  ten_du_an: string;
  /** Danh sách id phòng ban (multi select) */
  id_phong_ban: string[];
  ten_phong_ban?: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  muc_tieu: string;
  mo_ta: string;
  trang_thai: TrangThaiHoatDong;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface DuAnFormState {
  ma_du_an: string;
  ten_du_an: string;
  id_phong_ban: string[];
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  muc_tieu: string;
  mo_ta: string;
  trang_thai: TrangThaiHoatDong;
}
