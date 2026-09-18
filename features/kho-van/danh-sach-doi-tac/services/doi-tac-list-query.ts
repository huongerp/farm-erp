/** Tham số truy vấn danh sách Đối tác — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface DoiTacListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** 'Active' / 'Inactive' theo chip trạng thái. */
  status: string[];
  idNhom: string[];
  /** Lọc theo loại đối tác (nhà cung cấp / khách hàng) của tab đang mở. */
  loai: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const DOI_TAC_SORTABLE_DB_COLUMNS = new Set([
  'thu_tu',
  'ma_doi_tac',
  'ten_doi_tac',
  'loai_doi_tac',
  'dien_thoai',
  'email',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

export const DOI_TAC_SORT_MAC_DINH = { column: 'thu_tu', ascending: true } as const;
