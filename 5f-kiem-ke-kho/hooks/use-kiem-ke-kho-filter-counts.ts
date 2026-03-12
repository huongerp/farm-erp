import type { DotKiemKeKho } from '../core/types';
import type { KiemKeKhoFilters } from '../store/useKiemKeKhoStore';

export function useKiemKeKhoFilterCounts(
  items: DotKiemKeKho[],
  _filters: KiemKeKhoFilters
) {
  const trangThaiCounts: Record<string, number> = {};
  const nguoiPhuTrachCounts: Record<string, number> = {};
  const idKhoCounts: Record<string, number> = {};
  items.forEach((d) => {
    trangThaiCounts[d.trang_thai] = (trangThaiCounts[d.trang_thai] ?? 0) + 1;
    nguoiPhuTrachCounts[d.id_nguoi_phu_trach] = (nguoiPhuTrachCounts[d.id_nguoi_phu_trach] ?? 0) + 1;
    (d.id_kho ?? []).forEach((k) => {
      idKhoCounts[k] = (idKhoCounts[k] ?? 0) + 1;
    });
  });
  return { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts };
}
