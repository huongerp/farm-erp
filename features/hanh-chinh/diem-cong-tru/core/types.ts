/** Loại điểm: cộng hoặc trừ */
export type DiemCongTruLoai = 'cong' | 'tru';

/** Trạng thái bản ghi: mở (sửa/xoá theo quyền module) hoặc khoá (chỉ quản trị / cấp bậc 1) */
export type DiemCongTruTrangThai = 'mo' | 'khoa';

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
  /** Nội dung quản lý trao đổi — chỉ quản trị module / cấp bậc 1 được ghi (trigger DB). */
  quan_ly_trao_doi?: string;
  trang_thai: DiemCongTruTrangThai;
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
