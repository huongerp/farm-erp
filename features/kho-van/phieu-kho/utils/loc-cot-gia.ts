/**
 * Ẩn cột giá nhập (đơn giá, thành tiền, tổng tiền) của phiếu kho với người không toàn quyền.
 * Lọc ở chỗ tiêu thụ — store giữ nguyên cột mặc định để người toàn quyền vẫn dùng.
 */

/** Cột giá của bảng danh sách phiếu (tab Nhập / Xuất / Chuyển). */
export const COT_GIA_DANH_SACH: ReadonlySet<string> = new Set(['tong_tien']);
/** Cột giá của bảng tab Chi tiết. */
export const COT_GIA_CHI_TIET: ReadonlySet<string> = new Set(['don_gia', 'thanh_tien']);

/** Bỏ các cột giá khỏi danh sách cột khi `xemGia = false`; giữ nguyên tham chiếu khi được xem. */
export function locCotGia<T extends { id: string }>(
  columns: T[],
  cotGia: ReadonlySet<string>,
  xemGia: boolean,
): T[] {
  return xemGia ? columns : columns.filter((c) => !cotGia.has(c.id));
}
