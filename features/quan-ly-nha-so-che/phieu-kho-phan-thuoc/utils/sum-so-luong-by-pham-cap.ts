const EMPTY_PHAM_CAP = '—';

/**
 * Gom tổng `so_luong` theo phẩm cấp.
 * Trống/`null` → nhãn `—`; sắp xếp theo tên (vi), `—` xếp cuối.
 */
export function sumSoLuongByPhamCap(
  chiTiet: { pham_cap?: string | null; so_luong?: number | null }[]
): { phamCap: string; soLuong: number }[] {
  const map = new Map<string, number>();
  for (const c of chiTiet) {
    const key = c.pham_cap?.trim() || EMPTY_PHAM_CAP;
    map.set(key, (map.get(key) ?? 0) + (Number(c.so_luong) || 0));
  }
  return Array.from(map.entries())
    .map(([phamCap, soLuong]) => ({ phamCap, soLuong }))
    .sort((a, b) => {
      if (a.phamCap === EMPTY_PHAM_CAP) return 1;
      if (b.phamCap === EMPTY_PHAM_CAP) return -1;
      return a.phamCap.localeCompare(b.phamCap, 'vi');
    });
}
