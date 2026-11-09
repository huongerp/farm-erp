/** Tham số truy vấn danh sách Phiếu checklist công đoạn — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface ChecklistBanGiaoListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Lọc theo trạng thái (nhiều chọn). */
  trangThai: string[];
  /** Lọc theo mẫu checklist. */
  idMau: string[];
  /** YYYY-MM-DD, bỏ trống = không giới hạn. */
  ngayFrom: string | null;
  ngayTo: string | null;
  /** Tab nhanh "Chờ tôi kiểm tra": chỉ phiếu cho_kiem_tra mà chức vụ của tôi nằm trong khâu kiểm tra lại. */
  chiChoToiKiemTra: boolean;
  chucVuId: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const CL_BG_SORTABLE_DB_COLUMNS = new Set([
  'so_phieu',
  'ngay',
  'ca',
  'khu_vuc',
  'ten_mau',
  'trang_thai',
  'so_lan_tra_lai',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Ngày mới nhất lên đầu, cùng ngày thì phiếu mới hơn lên trước. */
export const CL_BG_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
