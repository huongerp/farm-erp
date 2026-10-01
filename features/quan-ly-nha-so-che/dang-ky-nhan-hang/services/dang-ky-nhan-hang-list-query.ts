/** Tham số truy vấn danh sách Đăng ký nhận hàng — lọc / sắp xếp / cắt trang ở PostgREST. */
import type { TrangThaiDkNh } from '../core/types';

export interface DangKyNhanHangListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  /** yyyy */
  nam: string[];
  /** yyyy-mm */
  thang: string[];
  trangThai: TrangThaiDkNh[] | string[];
  idChiNhanh: string[];
  /** Khoảng ngày đăng ký (ISO) — tab Thống kê. */
  ngayFrom?: string;
  ngayTo?: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const DKNH_SORTABLE_DB_COLUMNS = new Set([
  'ngay_dang_ky',
  'khach_hang',
  'loai_hang_hoa',
  'so_xe',
  'so_cont',
  'ten_tai_xe',
  'sdt_tai_xe',
  'gio_dang_ky_tu',
  'tg_vao_thuc_te',
  'tg_ra_thuc_te',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Ngày đăng ký mới nhất lên đầu. */
export const DKNH_SORT_MAC_DINH = { column: 'ngay_dang_ky', ascending: false } as const;
