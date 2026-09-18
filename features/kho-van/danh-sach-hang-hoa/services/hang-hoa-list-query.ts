/** Tham số truy vấn danh sách Hàng hoá — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface HangHoaListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** 'Active' / 'Inactive' theo chip trạng thái. */
  status: string[];
  idDanhMucCha: string[];
  idDanhMuc: string[];
  dvt: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const HANG_HOA_SORTABLE_DB_COLUMNS = new Set([
  'ma_hang_hoa',
  'ten_hang_hoa',
  'dvt',
  'pham_cap',
  'don_gia',
  'thu_tu',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Giữ đúng thứ tự cũ của danh sách: thu_tu rồi mã hàng. */
export const HANG_HOA_SORT_MAC_DINH = { column: 'thu_tu', ascending: true } as const;
