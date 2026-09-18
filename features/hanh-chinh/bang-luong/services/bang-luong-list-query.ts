/** Tham số truy vấn danh sách Bảng lương — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface BangLuongListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Kỳ lương `yyyy-mm`; rỗng = mọi kỳ. */
  yearMonth: string;
  /** Lọc theo phòng ban (id) — cột nằm ở bảng nhân viên. */
  phongBan: string[];
  /** Chỉ bảng lương của nhân viên này (tab "Của tôi"). */
  nhanVienId: string | null;
  /** Bỏ bảng lương của nhân viên này (tab Quản lý không hiện lương của chính mình). */
  loaiTruNhanVienId: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/** Cột sắp xếp được ở server (cột thật của bảng lương). */
export const BANG_LUONG_SORTABLE_DB_COLUMNS = new Set([
  'nam',
  'thang',
  'ngay_cong',
  'luong_co_ban',
  'luong_kpi',
  'diem_kpi',
  'tong_luong',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Kỳ mới nhất lên đầu. */
export const BANG_LUONG_SORT_MAC_DINH = { column: 'nam', ascending: false } as const;

/** Tách `yyyy-mm` thành số năm + số tháng; không hợp lệ thì trả null. */
export function tachKyLuong(yearMonth: string): { nam: number; thang: number } | null {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return null;
  const [y, m] = yearMonth.split('-').map(Number);
  if (m < 1 || m > 12) return null;
  return { nam: y, thang: m };
}
