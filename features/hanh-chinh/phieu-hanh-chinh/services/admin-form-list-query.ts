/** Tham số truy vấn danh sách Phiếu hành chính — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface AdminFormListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Trạng thái phiếu (giá trị lưu trong DB). */
  status: string[];
  /** Loại phiếu — mã app, service tự đổi sang id nhóm phiếu. */
  type: string[];
  /** Tháng `yyyy-mm`; rỗng = mọi tháng. Phiếu khớp khi khoảng của nó chạm vào tháng. */
  month: string;
  /**
   * Chỉ phiếu của những người này. null = mọi người (chỉ người có viewAll);
   * người không viewAll luôn bị ép `[chính mình]`.
   */
  nguoiTaoIds: string[] | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const ADMIN_FORM_SORTABLE_DB_COLUMNS = new Set(['ngay', 'den_ngay', 'trang_thai', 'tg_tao', 'tg_cap_nhat']);

export const ADMIN_FORM_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;

/** Khoảng ngày của một tháng `yyyy-mm`. */
export function khoangNgayCuaThang(month: string): { from: string; to: string } | null {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split('-').map(Number);
  if (m < 1 || m > 12) return null;
  return { from: `${month}-01`, to: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) };
}
