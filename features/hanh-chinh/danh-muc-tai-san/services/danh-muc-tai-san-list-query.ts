/** Tham số truy vấn danh sách Tài sản — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface DanhSachTaiSanListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  idNhom: string[];
  idNoiLuu: string[];
  idTrangThai: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/** Cột sắp xếp được ở server (cột thật của bảng). */
export const TAI_SAN_SORTABLE_DB_COLUMNS = new Set([
  'ma_tai_san',
  'ten_tai_san',
  'ten_nhom',
  'ten_noi_luu',
  'ten_trang_thai',
  'ten_nhan_vien',
  'ngay_nhap',
  'nguyen_gia',
  'gia_tri_con_lai',
  'tg_tao',
  'tg_cap_nhat',
]);

export const TAI_SAN_SORT_MAC_DINH = { column: 'tg_cap_nhat', ascending: false } as const;
