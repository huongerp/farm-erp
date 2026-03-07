import type { DotKiemKe } from '../core/types';
import type { KiemKeTaiSanFilters } from '../store/useKiemKeTaiSanStore';

export function useKiemKeFilterCounts(
  items: DotKiemKe[],
  filters: KiemKeTaiSanFilters
) {
  const trangThaiCounts: Record<string, number> = {};
  const nguoiPhuTrachCounts: Record<string, number> = {};
  items.forEach((d) => {
    trangThaiCounts[d.trang_thai] = (trangThaiCounts[d.trang_thai] ?? 0) + 1;
    nguoiPhuTrachCounts[d.id_nguoi_phu_trach] = (nguoiPhuTrachCounts[d.id_nguoi_phu_trach] ?? 0) + 1;
  });
  return { trangThaiCounts, nguoiPhuTrachCounts };
}
