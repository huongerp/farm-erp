import type { TrangThaiHoatDong } from '../../../../lib/constants';

/** Loại đối tác: Nhà cung cấp (phiếu nhập) hoặc Khách hàng (phiếu xuất). */
export type LoaiDoiTac = 'nha_cung_cap' | 'khach_hang';

/** Trạng thái đối tác – dùng TRANG_THAI_HOAT_DONG từ lib (lưu text trong Supabase). */
export type TrangThaiDoiTac = TrangThaiHoatDong;
export { TRANG_THAI_HOAT_DONG as TRANG_THAI_DOI_TAC } from '../../../../lib/constants';

/** Nhóm đối tác – loại: Nhà cung cấp / Khách hàng. Trạng thái lưu text. */
export interface NhomDoiTac {
  id: string;
  ma_nhom: string;
  ten_nhom: string;
  /** Loại: nha_cung_cap | khach_hang (cột loai trên Supabase) */
  loai?: LoaiDoiTac | null;
  thu_tu?: number;
  trang_thai: TrangThaiHoatDong;
  tg_tao?: string;
  tg_cap_nhat?: string;
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
  /** Mã BIN ngân hàng (Napas247 / VietQR), vd 970422 = MB. */
  ngan_hang_bin?: string;
  so_tai_khoan?: string;
  chu_tai_khoan?: string;
  tag_ids: string[];
  ten_tags?: string[];
  trang_thai: TrangThaiHoatDong;
  thu_tu: number;
  tg_tao: string;
  tg_cap_nhat: string;
}
