export interface Kho {
  id: string;
  ma_kho: string;
  ten_kho: string;
  dia_chi?: string;
  mo_ta?: string;
  id_chi_nhanh?: string | null;
  ten_chi_nhanh?: string;
  trang_thai: 0 | 1;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}
