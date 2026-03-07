/** Loại điểm: cộng hoặc trừ */
export type DiemCongTruLoai = 'cong' | 'tru';

export interface DiemCongTruRecord {
  id: string;
  id_nhan_vien: string;
  ten_nhan_vien?: string;
  ma_nhan_vien?: string;
  nam: number;
  thang: number;
  loai: DiemCongTruLoai;
  id_hang_muc: string;
  ten_hang_muc?: string;
  ma_hang_muc?: string;
  diem: number;
  mo_ta?: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface DiemCongTruFormState {
  id_nhan_vien: string;
  nam: number;
  thang: number;
  loai: DiemCongTruLoai | '';
  id_hang_muc: string;
  diem: number;
  mo_ta?: string;
}
