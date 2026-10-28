/**
 * Tham số truy vấn danh sách phiếu Đánh giá đầu vào (view `v_fp_farm_dgdv_tong_chuyen`, 1 dòng / chuyến)
 * — lọc / sắp xếp / cắt trang ở PostgREST.
 */

export interface DgdvListServerQuery {
  page: number;
  pageSize: number;
  searchTerm: string;
  viewAll: boolean;
  allowedBranchIds: string[];
  /** Lọc ngày từ / đến 'YYYY-MM-DD' (gồm cả hai đầu); null = không giới hạn */
  tuNgay: string | null;
  denNgay: string | null;
  /** Tuần farm dạng khoá `khoaTuanFarm` ('2026-44'); service đổi thành danh sách ngày của các tuần. */
  tuanFarm: string[];
  trangThai: string[];
  idChiNhanh: string[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
}

/**
 * Cột sắp xếp được ở server. `ngay` → ngay rồi chuyen; `chuyen` → chuyen rồi ngay; `tuan` → nam, tuan
 * rồi ngay, chuyen. Tổng thu / KSC là cột của view nên sắp được ở DB (% KSC thì không — tính ở app).
 */
export const DGDV_SORTABLE_DB_COLUMNS = new Set([
  'ngay',
  'chuyen',
  'tuan',
  'id_chi_nhanh',
  'tong_thu',
  'ksc',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
]);

/** Mặc định: ngày giảm, chuyến giảm. */
export const DGDV_SORT_MAC_DINH = { column: 'ngay', ascending: false } as const;

/** Xuất chi tiết dạng dòng từ danh sách: tối đa số phiếu một lần (mỗi phiếu kéo cả lưới). */
export const DGDV_XUAT_CHI_TIET_TOI_DA = 300;
