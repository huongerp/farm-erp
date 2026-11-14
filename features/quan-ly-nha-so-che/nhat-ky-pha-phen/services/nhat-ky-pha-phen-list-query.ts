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

/** Tab Chi tiết (từng lần pha) — cùng phạm vi xem và bộ lọc kỳ / NSC như tab Nhật ký, không có ô tìm kiếm. */
export type NkppChiTietListServerQuery = Omit<NhatKyPhaPhenListServerQuery, 'searchTerm'>;

/** Cột bảng → biểu thức `order` của PostgREST (ngày nằm ở phiếu cha `nk`). */
export const NKPP_CHI_TIET_SORT_DB: Readonly<Record<string, string>> = {
  ngay: 'nk(ngay)',
  lan: 'lan',
  gio: 'gio',
  so_kg: 'so_kg',
  dinh_muc_kg: 'dinh_muc_kg',
};
