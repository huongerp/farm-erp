/** Tham số truy vấn danh sách Giám sát chất lượng — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface GiamSatChatLuongListServerQuery {
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
  ketLuan: string[];
  idChiNhanh: string[];
  idHangHoa: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const GSCL_SORTABLE_DB_COLUMNS = new Set([
  'ngay',
  'so_phieu',
  'ma_cay_hang',
  'so_thung_cay',
  'so_thung_mau',
  'trang_thai',
  'ket_luan',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Ngày mới nhất lên đầu. */
export const GSCL_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
