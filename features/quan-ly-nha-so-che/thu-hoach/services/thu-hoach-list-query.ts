/** Tham số truy vấn danh sách Thu hoạch — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface ThuHoachListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  nam: string[];
  tuan: string[];
  idChiNhanh: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const THU_HOACH_SORTABLE_DB_COLUMNS = new Set([
  'nam',
  'tuan',
  'ten_chi_nhanh',
  'du_thu_tuan',
  'thu_du_kien',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Tuần mới nhất lên đầu. */
export const THU_HOACH_SORT_MAC_DINH = { column: 'nam', ascending: false } as const;
