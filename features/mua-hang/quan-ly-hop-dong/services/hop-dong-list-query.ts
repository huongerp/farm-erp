/** Tham số truy vấn danh sách Hợp đồng — lọc / sắp xếp / cắt trang ở PostgREST. */

export interface HopDongListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  trangThai: string[];
  nccIds: string[];
  dateFrom: string;
  dateTo: string;
  nguoiTaoIds: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

export const HOP_DONG_SORTABLE_DB_COLUMNS = new Set([
  'ma_hop_dong',
  'ten_hop_dong',
  'ngay',
  'ten_nha_cung_cap',
  'so_luong_cay',
  'don_gia',
  'thanh_tien',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

export const HOP_DONG_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;
