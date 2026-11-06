/**
 * Ẩn cột giá (đơn giá, thành tiền, tổng tiền) của danh sách phiếu / tab chi tiết với người
 * không được xem giá nhập (`useXemGiaNhap`). Lọc ở chỗ tiêu thụ — store giữ nguyên cột mặc định.
 */
export const COT_GIA_PHIEU_KHO_PT: ReadonlySet<string> = new Set(['tong_tien', 'don_gia', 'thanh_tien']);

/**
 * Bộ chọn cột đã lọc báo chỉ số kéo thả theo danh sách rút gọn (theo `order`), còn store
 * `reorderColumns` làm việc trên danh sách đầy đủ → đổi chỉ số rút gọn sang chỉ số đầy đủ.
 */
export function anhXaChiSoSapXep<T extends { id: string; order: number }>(
  columnsAll: T[],
  columnsLoc: T[],
  from: number,
  to: number
): [number, number] | null {
  const byOrder = (a: T, b: T) => a.order - b.order;
  const full = [...columnsAll].sort(byOrder);
  const loc = [...columnsLoc].sort(byOrder);
  const fromId = loc[from]?.id;
  const toId = loc[to]?.id;
  if (fromId == null || toId == null) return null;
  return [full.findIndex((c) => c.id === fromId), full.findIndex((c) => c.id === toId)];
}

/** Bỏ cột giá khỏi danh sách cột (bảng, bộ chọn ẩn/hiện cột, kéo cột) khi `!xemGia`. */
export function locCotTheoXemGia<T extends { id: string }>(columns: T[], xemGia: boolean): T[] {
  return xemGia ? columns : columns.filter((c) => !COT_GIA_PHIEU_KHO_PT.has(c.id));
}
