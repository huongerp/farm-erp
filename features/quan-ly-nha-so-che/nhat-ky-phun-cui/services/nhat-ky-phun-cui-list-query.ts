/** Tham số truy vấn danh sách Nhật ký pha thuốc phun cùi — lọc / sắp xếp / cắt trang ở PostgREST. */
export interface NhatKyPhunCuiListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  /** yyyy-mm */
  thang: string[];
  idChiNhanh: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const NKPC_SORTABLE_DB_COLUMNS = new Set(['ngay', 'tg_tao', 'tg_cap_nhat']);

/** Ngày mới nhất lên đầu. */
export const NKPC_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
