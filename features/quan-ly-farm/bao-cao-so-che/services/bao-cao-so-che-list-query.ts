/**
 * Tham số truy vấn danh sách Báo cáo sơ chế — lọc / sắp xếp / cắt trang ở PostgREST.
 *
 * Trước đây màn này tải toàn bộ bảng cha rồi ba bảng con qua `.in()` chứa mọi id
 * (4 lượt tải toàn bảng cho mỗi lần mở trang).
 */
export { dieuKienKyTheoNgay, khoangNgay } from '../../../../lib/postgrest-search';

export interface BaoCaoSoCheListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  nam: string[];
  thang: string[];
  trangThai: string[];
  idChiNhanh: string[];
  /** Đơn vị tính nằm ở bảng con `_ct` — lọc qua embed `!inner`. */
  donViTinh: string[];
  /** Khoảng ngày (ISO) — dùng cho màn Thống kê sản xuất; rỗng = không giới hạn. */
  ngayFrom?: string;
  ngayTo?: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/** Cột sắp xếp được ở server (cột của chính bảng cha). */
export const BCSC_SORTABLE_DB_COLUMNS = new Set([
  'ngay',
  'ten_chi_nhanh',
  'trang_thai',
  'tong_luong',
  'tg_tao',
  'tg_cap_nhat',
]);

export const BCSC_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
