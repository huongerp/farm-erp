export type CongViecTrangThai =
  | 'draft'
  | 'dang_thuc_hien'
  | 'cho_bao_cao'
  | 'hoan_thanh'
  | 'huy';

export type CongViecUuTien = 'cao' | 'trung_binh' | 'thap';

export interface CongViec {
  id: string;
  ma_cong_viec: string;
  tieu_de: string;
  mo_ta: string;
  id_du_an: string | null;
  ten_du_an?: string | null;
  id_cha: string | null;
  id_nguoi_giao: string;
  ten_nguoi_giao?: string;
  danh_sach_nguoi_thuc_hien: string[];
  ten_nguoi_thuc_hien?: string[];
  uu_tien: CongViecUuTien;
  trang_thai: CongViecTrangThai;
  ngay_het_han: string;
  phan_tram_hoan_thanh: number;
  id_mau_cong_viec: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface BaoCaoKetQua {
  id: string;
  id_cong_viec: string;
  noi_dung: string;
  links: string[];
  file_dinh_kem: string;
  nguoi_bao_cao_id: string;
  ten_nguoi_bao_cao?: string;
  tg_bao_cao: string;
}

export interface BinhLuanCongViec {
  id: string;
  id_cong_viec: string;
  noi_dung: string;
  nguoi_gui_id: string;
  ten_nguoi_gui?: string;
  tg_gui: string;
}

export interface CongViecFormState {
  ma_cong_viec: string;
  tieu_de: string;
  mo_ta: string;
  id_du_an: string | null;
  id_cha: string | null;
  danh_sach_nguoi_thuc_hien: string[];
  uu_tien: CongViecUuTien;
  trang_thai: CongViecTrangThai;
  ngay_het_han: string;
  phan_tram_hoan_thanh: number;
  id_mau_cong_viec: string | null;
}
