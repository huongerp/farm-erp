/** Tham số truy vấn danh sách Phiếu cấp phát / thu hồi — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface CapPhatThuHoiListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  loaiPhieu: string[];
  ngayFrom: string;
  ngayTo: string;
  idNguoiThucHien: string[];
  /** Chỉ phiếu liên quan tới người này (tab "Của tôi"). */
  idNguoiCuaToi: string | null;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const CPTH_SORTABLE_DB_COLUMNS = new Set([
  'ma_phieu',
  'loai_phieu',
  'ngay_thuc_hien',
  'ten_nguoi_thuc_hien',
  'ten_nguoi_giu_truoc',
  'ten_nguoi_giu_sau',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

export const CPTH_SORT_MAC_DINH = { column: 'tg_tao', ascending: false } as const;
