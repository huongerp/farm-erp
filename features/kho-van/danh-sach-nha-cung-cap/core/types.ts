/** Nhóm nhà cung cấp – dùng cho dropdown và filter. */
export interface NhomNhaCungCap {
  id: string;
  ma_nhom: string;
  ten_nhom: string;
  thu_tu?: number;
  trang_thai: 0 | 1;
}

/** Tag – gắn vào NCC để quản lý (MultiSelect, chip). */
export interface Tag {
  id: string;
  ten_tag: string;
}

/** Nhà cung cấp: id_nhom + tag_ids; ten_nhom và ten_tags enrich từ service. */
export interface NhaCungCap {
  id: string;
  ma_ncc: string;
  ten_ncc: string;
  id_nhom: string | null;
  ten_nhom?: string;
  dia_chi?: string;
  dien_thoai?: string;
  email?: string;
  mo_ta?: string;
  tag_ids: string[];
  ten_tags?: string[];
  trang_thai: 0 | 1;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}
