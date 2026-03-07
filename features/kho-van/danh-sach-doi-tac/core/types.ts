/** Loại đối tác: Nhà cung cấp (phiếu nhập) hoặc Khách hàng (phiếu xuất). */
export type LoaiDoiTac = 'nha_cung_cap' | 'khach_hang';

/** Nhóm đối tác – dùng chung cho NCC và KH. */
export interface NhomDoiTac {
  id: string;
  ma_nhom: string;
  ten_nhom: string;
  thu_tu?: number;
  trang_thai: 0 | 1;
}

/** Tag – gắn vào đối tác để quản lý (MultiSelect, chip). */
export interface Tag {
  id: string;
  ten_tag: string;
}

/** Đối tác: một bảng dùng chung; loai_doi_tac phân biệt NCC/KH. id_nhom + tag_ids; ten_nhom và ten_tags enrich từ service. */
export interface DoiTac {
  id: string;
  ma_ncc: string;
  ten_ncc: string;
  loai_doi_tac: LoaiDoiTac;
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
