export interface LoaiTaiLieu {
  id: string;
  ma: string;
  ten: string;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface LoaiTaiLieuFormState {
  ma: string;
  ten: string;
  ghi_chu?: string;
  trang_thai: number;
}

export interface TrangThaiTaiLieu {
  id: string;
  ma: string;
  ten: string;
  thu_tu: number;
  mau?: string;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface TrangThaiTaiLieuFormState {
  ma: string;
  ten: string;
  thu_tu: number;
  mau?: string;
  ghi_chu?: string;
  trang_thai: number;
}

/** Nhóm tài liệu (phân loại tài liệu theo nhóm) */
export interface NhomTaiLieu {
  id: string;
  ma: string;
  ten: string;
  ghi_chu?: string;
  trang_thai: 0 | 1;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface NhomTaiLieuFormState {
  ma: string;
  ten: string;
  ghi_chu?: string;
  trang_thai: number;
}
