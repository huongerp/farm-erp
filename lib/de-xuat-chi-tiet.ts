/**
 * Dòng hàng "dở dang" trong form đề xuất (mua hàng / vật tư): đã chọn hàng mà số
 * lượng ≤ 0, hoặc nhập số lượng mà chưa chọn hàng.
 *
 * Trước đây những dòng này bị lọc ngầm lúc Lưu — người dùng tưởng đã đề xuất mà
 * phiếu thiếu hàng. Dòng trống hoàn toàn (mới bấm "Thêm dòng") thì vẫn bỏ qua.
 */
export interface DongDeXuatLike {
  id_hang_hoa?: string | null;
  so_luong?: number | string | null;
}

export function dongDeXuatDoDang(rows: DongDeXuatLike[]): number[] {
  const out: number[] = [];
  rows.forEach((r, i) => {
    const coHang = !!r.id_hang_hoa?.trim();
    const sl = Number(r.so_luong ?? 0);
    const coSoLuong = Number.isFinite(sl) && sl > 0;
    if (coHang !== coSoLuong) out.push(i);
  });
  return out;
}
