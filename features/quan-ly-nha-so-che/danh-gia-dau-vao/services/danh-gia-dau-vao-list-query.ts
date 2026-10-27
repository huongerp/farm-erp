/** Tham số truy vấn danh sách phiếu Đánh giá đầu vào — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface DgdvListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  nam: string[];
  /** Tuần ISO dạng chuỗi '1'…'53' */
  tuan: string[];
  trangThai: string[];
  idChiNhanh: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/**
 * Cột sắp xếp được ở server. `nam_tuan` (cột hiển thị Năm/Tuần) → sắp theo nam rồi tuan;
 * tổng thu / KSC là số cộng từ bảng con nên không sắp ở DB được.
 */
export const DGDV_SORTABLE_DB_COLUMNS = new Set(['nam_tuan', 'id_chi_nhanh', 'trang_thai', 'tg_tao', 'tg_cap_nhat']);

export const DGDV_SORT_MAC_DINH = { column: 'nam_tuan', ascending: false } as const;
