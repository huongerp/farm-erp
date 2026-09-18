/** Tham số truy vấn danh sách Điểm cộng trừ — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface DiemCongTruListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Loại điểm (cộng / trừ). */
  loai: string[];
  /** Kỳ `yyyy-mm`; rỗng = mọi kỳ. */
  yearMonth: string;
  /** Chỉ điểm của nhân viên này (khi không có quyền xem toàn bộ). */
  idNhanVien: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const DIEM_CT_SORTABLE_DB_COLUMNS = new Set([
  'nam',
  'thang',
  'loai',
  'ten_hang_muc',
  'diem',
  'tg_tao',
  'tg_cap_nhat',
]);

export const DIEM_CT_SORT_MAC_DINH = { column: 'nam', ascending: false } as const;
