/** Loại khóa học (Kỹ năng, Văn hóa, Quy trình / Quy định...) */
export interface LoaiKhoaHoc {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface LoaiKhoaHocFormState {
  ma: string;
  ten: string;
  thu_tu: number;
  ghi_chu?: string;
  trang_thai: number;
}
