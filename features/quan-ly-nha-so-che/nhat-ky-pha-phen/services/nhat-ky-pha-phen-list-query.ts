/** Tham số truy vấn danh sách Nhật ký pha phèn — lọc / sắp xếp / cắt trang ở PostgREST. */
export interface NhatKyPhaPhenListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  /** yyyy */
  nam: string[];
  /** yyyy-mm */
  thang: string[];
  idChiNhanh: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const NKPP_SORTABLE_DB_COLUMNS = new Set([
  'ngay',
  'so_buong_du_thu',
  'so_be_so_che',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Ngày mới nhất lên đầu. */
export const NKPP_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
