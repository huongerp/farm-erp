/** Tham số truy vấn danh sách Đăng ký tham quan — lọc / sắp xếp / cắt trang ở PostgREST. */
export interface DangKyThamQuanListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  /** yyyy */
  nam: string[];
  /** yyyy-mm */
  thang: string[];
  trangThai: string[];
  idChiNhanh: string[];
  mucDich: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const DKTQ_SORTABLE_DB_COLUMNS = new Set([
  'ngay_dang_ky',
  'tg_bat_dau',
  'nguoi_dai_dien',
  'phuong_tien',
  'tg_vao_thuc_te',
  'tg_ra_thuc_te',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Giờ tham quan mới nhất lên đầu. */
export const DKTQ_SORT_MAC_DINH = { column: 'tg_bat_dau', ascending: false } as const;
