/** Tham số truy vấn danh sách Phiếu bảo trì / sửa chữa — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface BaoTriSuaChuaListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  hangMuc: string[];
  ngayFrom: string;
  ngayTo: string;
  idTaiSan: string[];
  trangThai: string[];
  idNguoiTao: string[];
  /**
   * Ràng buộc theo tài sản đã tính sẵn ở component (chi nhánh của tài sản + phạm
   * vi xem). `null` = không ràng buộc; mảng rỗng = không có tài sản nào hợp lệ.
   */
  idTaiSanChoPhep: string[] | null;
  /** Chỉ phiếu do người này tạo (dùng cùng `idTaiSanChoPhep` cho phạm vi "của tôi"). */
  idNguoiTaoCuaToi: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const BTSC_SORTABLE_DB_COLUMNS = new Set([
  'ma_phieu',
  'ngay',
  'ma_tai_san',
  'ten_tai_san',
  'ten_hang_muc',
  'so_tien',
  'ten_trang_thai',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
]);

export const BTSC_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
