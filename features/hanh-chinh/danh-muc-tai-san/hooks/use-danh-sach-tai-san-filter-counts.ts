import { useMemo } from 'react';
import type { TaiSan } from '../core/types';
import type { DanhSachTaiSanFilters } from '../store/useDanhSachTaiSanStore';

/**
 * Đếm số tài sản theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 */
export function useDanhSachTaiSanFilterCounts(
  items: TaiSan[],
  filters: DanhSachTaiSanFilters,
) {
  return useMemo(() => {
    const statusCounts: Record<string, number> = { Active: 0, Inactive: 0 };
    const nhomCounts: Record<string, number> = {};
    const noiLuuCounts: Record<string, number> = {};
    const trangThaiCounts: Record<string, number> = {};

    const matchStatus = (item: TaiSan) =>
      filters.status.length === 0 ||
      (filters.status.includes('Active') && item.trang_thai === 1) ||
      (filters.status.includes('Inactive') && item.trang_thai === 0);
    const matchNhom = (item: TaiSan) =>
      filters.id_nhom.length === 0 || (item.id_nhom && filters.id_nhom.includes(item.id_nhom));
    const matchNoiLuu = (item: TaiSan) =>
      filters.id_noi_luu.length === 0 || (item.id_noi_luu && filters.id_noi_luu.includes(item.id_noi_luu));
    const matchTrangThai = (item: TaiSan) =>
      filters.id_trang_thai.length === 0 ||
      (item.id_trang_thai && filters.id_trang_thai.includes(item.id_trang_thai));

    for (const item of items) {
      const passStatus = matchStatus(item);
      const passNhom = matchNhom(item);
      const passNoiLuu = matchNoiLuu(item);
      const passTrangThai = matchTrangThai(item);

      if (passNhom && passNoiLuu && passTrangThai) {
        const k = item.trang_thai === 1 ? 'Active' : 'Inactive';
        statusCounts[k] = (statusCounts[k] ?? 0) + 1;
      }
      if (passStatus && passNoiLuu && passTrangThai && item.id_nhom) {
        nhomCounts[item.id_nhom] = (nhomCounts[item.id_nhom] || 0) + 1;
      }
      if (passStatus && passNhom && passTrangThai && item.id_noi_luu) {
        noiLuuCounts[item.id_noi_luu] = (noiLuuCounts[item.id_noi_luu] || 0) + 1;
      }
      if (passStatus && passNhom && passNoiLuu && item.id_trang_thai) {
        trangThaiCounts[item.id_trang_thai] = (trangThaiCounts[item.id_trang_thai] || 0) + 1;
      }
    }

    return { statusCounts, nhomCounts, noiLuuCounts, trangThaiCounts };
  }, [items, filters]);
}
