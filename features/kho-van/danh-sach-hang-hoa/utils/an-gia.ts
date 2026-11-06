/** Mã cột giá nhập của Hàng hoá — ẩn với người không có quyền xem giá (`useXemGiaNhap`). */
export const COT_GIA_HANG_HOA = 'don_gia';

/**
 * Bỏ cột giá khỏi danh sách cột (cột bảng dùng `id`, cột xuất dùng `key`) khi người dùng
 * không được xem giá. Truyền `layMa` để lấy mã cột từ phần tử.
 */
export function locCotTheoQuyenXemGia<T>(cols: T[], xemGia: boolean, layMa: (c: T) => string): T[] {
  return xemGia ? cols : cols.filter((c) => layMa(c) !== COT_GIA_HANG_HOA);
}
