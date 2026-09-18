/** Tham số truy vấn danh sách Dự báo SL đóng thùng — lọc / sắp xếp / cắt trang ở PostgREST. */
export { dieuKienKyTheoNgay, khoangNgay } from '../../../../lib/postgrest-search';

export interface DuBaoSlDongThungListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  nam: string[];
  thang: string[];
  trangThai: string[];
  idChiNhanh: string[];
  /** Khoảng ngày (ISO) — dùng cho màn Thống kê sản xuất; rỗng = không giới hạn. */
  ngayFrom?: string;
  ngayTo?: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/** Cột sắp xếp được ở server (mọi cột của bảng đều là cột thật). */
export const DBDT_SORTABLE_DB_COLUMNS = new Set([
  'ngay',
  'ten_chi_nhanh',
  'trang_thai',
  'tong_buong_nhap_ke_hoach',
  'tong_buong_nhap_thuc_te',
  'tong_so_thung_ke_hoach',
  'tong_so_thung_thuc_te',
  'tg_tao',
  'tg_cap_nhat',
]);

export const DBDT_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
