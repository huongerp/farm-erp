export type CongViecTrangThai =
  | 'draft'
  | 'dang_thuc_hien'
  | 'cho_bao_cao'
  | 'hoan_thanh'
  | 'huy';

export type CongViecUuTien = 'cao' | 'trung_binh' | 'thap';

/** Một mục trao đổi/bình luận trong cột trao_doi (jsonb) của công việc */
export interface TraoDoiEntry {
  id: string;
  noi_dung: string;
  nguoi_gui_id: string;
  ten_nguoi_gui?: string;
  tg_gui: string;
}

export interface CongViec {
  id: number;
  tieu_de: string;
  mo_ta: string;
  id_cha: number | null;
  id_nguoi_giao: number;
  trach_nhiem: number | null;
  nguoi_ho_tro: number[];
  uu_tien: CongViecUuTien;
  trang_thai: CongViecTrangThai;
  tg_tao: string;
  tg_cap_nhat: string;
  trao_doi: TraoDoiEntry[];
  ket_qua: string | null;
  link_ket_qua: string | null;
  /** Gantt / báo cáo — có thể có từ API hoặc enrich */
  ngay_het_han?: string | null;
  ma_cong_viec?: string | null;
}

export interface CongViecFormState {
  tieu_de: string;
  mo_ta: string;
  id_cha: number | null;
  trach_nhiem: number | null;
  nguoi_ho_tro: number[];
  uu_tien: CongViecUuTien;
  trang_thai: CongViecTrangThai;
}
