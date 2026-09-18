/** Tham số truy vấn danh sách Thanh toán đối tác — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface ThanhToanDoiTacListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  statusIds: string[];
  doiTacIds: string[];
  donViIds: string[];
  /** Phạm vi xem: toàn bộ / theo chi nhánh / chỉ phiếu của mình. */
  viewAll: boolean;
  viewByBranch: boolean;
  allowedBranchIds: string[];
  currentEmployeeId: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const TTDT_SORTABLE_DB_COLUMNS = new Set([
  'so_phieu',
  'hang_muc_thanh_toan',
  'ngay',
  'ngay_xu_ly',
  'so_tien',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

export const TTDT_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
