/** Tham số truy vấn danh sách Kỳ khấu hao — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface KyKhauHaoListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Năm (yyyy); rỗng = mọi năm. */
  nam: string;
  thang: string[];
  trangThai: string[];
  /** Chỉ kỳ do người này tạo (khi không có quyền xem toàn bộ). */
  idNguoiTao: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const KY_KHAU_HAO_SORTABLE_DB_COLUMNS = new Set([
  'nam',
  'thang',
  'trang_thai',
  'tong_nguyen_gia',
  'tong_khau_hao_ky',
  'tg_tao',
  'tg_cap_nhat',
]);

export const KY_KHAU_HAO_SORT_MAC_DINH = { column: 'nam', ascending: false } as const;
