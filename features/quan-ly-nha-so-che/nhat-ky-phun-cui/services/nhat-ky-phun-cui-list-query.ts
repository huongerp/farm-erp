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

/** Tab Chi tiết (từng lần pha) — cùng phạm vi xem và bộ lọc tháng / NSC như tab Nhật ký, không có ô tìm kiếm. */
export type NkpcChiTietListServerQuery = Omit<NhatKyPhunCuiListServerQuery, 'searchTerm'>;

/** Cột bảng → biểu thức `order` của PostgREST (ngày nằm ở phiếu cha `nk`). */
export const NKPC_CHI_TIET_SORT_DB: Readonly<Record<string, string>> = {
  ngay: 'nk(ngay)',
  thu_tu: 'thu_tu',
  gio: 'gio',
  nong_do: 'nong_do',
  luong_nuoc_lit: 'luong_nuoc_lit',
  luong_thuoc: 'luong_thuoc',
};
