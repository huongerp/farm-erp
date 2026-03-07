export interface HoSo {
  id: string;
  /** Tài liệu cha (1 tài liệu có nhiều hồ sơ) */
  id_tai_lieu: string;
  ten_tai_lieu?: string;
  ma_ho_so: string;
  ten_ho_so: string;
  /** Phòng quản lý */
  id_phong_ban?: string;
  ten_phong_ban?: string;
  thoi_han_luu_tru?: string;
  mo_ta?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface HoSoFormState {
  id_tai_lieu: string;
  ma_ho_so: string;
  ten_ho_so: string;
  id_phong_ban?: string;
  thoi_han_luu_tru?: string;
  mo_ta?: string;
  trang_thai: number;
}
