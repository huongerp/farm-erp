/** Nhóm đối tác – dùng cho NCC (Mua hàng). */
export interface NhomDoiTac {
  id: string;
  ma_nhom: string;
  ten_nhom: string;
  thu_tu?: number;
  trang_thai: 0 | 1;
}

/** Tag – gắn vào nhà cung cấp (MultiSelect, chip). */
export interface Tag {
  id: string;
  ten_tag: string;
}

/** Nhà cung cấp – module Danh sách đối tác (Mua hàng). Có nhóm + tag. */
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
  /** 0 = Ngừng, 1 = Hoạt động */
  trang_thai: 0 | 1;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}
