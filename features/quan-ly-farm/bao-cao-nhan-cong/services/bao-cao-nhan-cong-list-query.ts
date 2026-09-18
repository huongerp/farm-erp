/**
 * Tham số truy vấn danh sách Báo cáo nhân công — dựng ở component, gửi xuống
 * service để PostgREST lọc / sắp xếp / cắt trang.
 *
 * Trước đây màn này tải TOÀN BỘ bảng cha rồi hai bảng con qua `.in()` chứa mọi
 * id, sau đó mới lọc bằng `useMemo`. Bảng ghi theo ngày × chi nhánh nên chỉ tăng
 * chứ không giảm.
 */

export interface BaoCaoNhanCongListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Xem toàn phạm vi (cấp bậc 1 / quyền admin). */
  viewAll: boolean;
  /** Chi nhánh được phép xem khi không phải toàn phạm vi. */
  allowedBranchIds: string[];
  /** Năm (yyyy) lấy từ cột ngày. */
  nam: string[];
  /** Tháng (yyyy-mm) lấy từ cột ngày. */
  thang: string[];
  trangThai: string[];
  idChiNhanh: string[];
  /** Khoảng ngày (ISO) — dùng cho màn Thống kê sản xuất; rỗng = không giới hạn. */
  ngayFrom?: string;
  ngayTo?: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/**
 * Cột sắp xếp được ở server (cột của chính bảng cha).
 * Cột tổng hợp từ bảng con (tổng công, tổng tăng ca…) không sắp xếp ở DB được —
 * xem `BCNC_SORT_MAC_DINH`.
 */
export const BCNC_SORTABLE_DB_COLUMNS = new Set([
  'ngay',
  'ten_chi_nhanh',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Sắp xếp mặc định: phiếu mới nhất lên đầu. */
export const BCNC_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;

export { dieuKienKyTheoNgay, khoangNgay } from '../../../../lib/postgrest-search';
