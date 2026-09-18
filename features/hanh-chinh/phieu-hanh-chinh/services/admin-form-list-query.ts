/** Tham số truy vấn danh sách Phiếu hành chính — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface AdminFormListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  /** Trạng thái phiếu (giá trị lưu trong DB). */
  status: string[];
  /** Loại phiếu — mã app, service tự đổi sang id nhóm phiếu. */
  type: string[];
  shift: string[];
  /** Tháng `yyyy-mm`; rỗng = mọi tháng. */
  month: string;
  /** Chỉ phiếu do người này tạo (tab "Của tôi"). */
  nguoiTaoId: string | null;
  /** Bỏ phiếu do người này tạo (tab Quản lý không hiện phiếu của chính mình). */
  loaiTruNguoiTaoId: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const ADMIN_FORM_SORTABLE_DB_COLUMNS = new Set(['ngay', 'ca', 'trang_thai', 'tg_tao', 'tg_cap_nhat']);

export const ADMIN_FORM_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;

/** Khoảng ngày của một tháng `yyyy-mm`. */
export function khoangNgayCuaThang(month: string): { from: string; to: string } | null {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split('-').map(Number);
  if (m < 1 || m > 12) return null;
  return { from: `${month}-01`, to: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) };
}
