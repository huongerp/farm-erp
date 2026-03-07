/** Loại chiến lược TOWS: SO, ST, WO, WT */
export type LoaiTows = 'SO' | 'ST' | 'WO' | 'WT';

/** Trạng thái duyệt chiến lược */
export type TrangThaiDuyet = 'cho_duyet' | 'da_duyet' | 'khong_duyet';

/** Trạng thái triển khai chiến lược */
export type TrangThaiTrienKhai =
  | 'chua_bat_dau'
  | 'dang_trien_khai'
  | 'tam_ngung'
  | 'hoan_thanh'
  | 'huy';

/** Nhóm loại chiến lược (dùng cho tab Thiết lập) */
export type NhomLoaiChienLuoc = 'tows' | 'ansoff' | 'corporate' | 'integration';

/** Chiến lược */
export interface ChienLuoc {
  id: string;
  nam: number;
  ma?: string | null;
  ten: string;
  mo_ta?: string | null;
  loai_tows: LoaiTows;
  nhom_chien_luoc: string;
  id_swot_analysis?: string | null;
  id_strengths: string[];
  id_weaknesses: string[];
  id_opportunities: string[];
  id_threats: string[];
  trang_thai_duyet: TrangThaiDuyet;
  trang_thai_trien_khai: TrangThaiTrienKhai;
  id_nguoi_phu_trach?: string | null;
  ngay_bat_dau?: string | null;
  ngay_ket_thuc?: string | null;
  uu_tien?: number | null;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Loại chiến lược (master cho tab Thiết lập) */
export interface LoaiChienLuoc {
  id: string;
  nhom: NhomLoaiChienLuoc;
  ma: string;
  ten: string;
  mo_ta?: string | null;
  /** Câu chiến lược mẫu (template): VD "Dùng hội nhập ngang để ... nhằm ..." – quan điểm chuyên gia quản trị */
  cau_chien_luoc_mau?: string | null;
  thu_tu: number;
}
