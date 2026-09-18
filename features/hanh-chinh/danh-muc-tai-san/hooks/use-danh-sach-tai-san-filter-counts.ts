import { useMemo } from 'react';
import type { TaiSanTomTat } from '../services/danh-muc-tai-san-service';
import type { DanhSachTaiSanFilters } from '../store/useDanhSachTaiSanStore';

/**
 * Đếm số tài sản theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 */
export function useDanhSachTaiSanFilterCounts(
  items: TaiSanTomTat[],
  filters: DanhSachTaiSanFilters,
) {
  return useMemo(() => {
    const nhomCounts: Record<string, number> = {};
    const noiLuuCounts: Record<string, number> = {};
    const trangThaiCounts: Record<string, number> = {};

    const matchNhom = (item: TaiSanTomTat) =>
      filters.id_nhom.length === 0 || (item.id_nhom && filters.id_nhom.includes(item.id_nhom));
    const matchNoiLuu = (item: TaiSanTomTat) =>
      filters.id_noi_luu.length === 0 || (item.id_noi_luu && filters.id_noi_luu.includes(item.id_noi_luu));
    const matchTrangThai = (item: TaiSanTomTat) =>
      filters.id_trang_thai.length === 0 ||
      (item.id_trang_thai && filters.id_trang_thai.includes(item.id_trang_thai));

    for (const item of items) {
      const passNhom = matchNhom(item);
      const passNoiLuu = matchNoiLuu(item);
      const passTrangThai = matchTrangThai(item);

      if (passNoiLuu && passTrangThai && item.id_nhom) {
        nhomCounts[item.id_nhom] = (nhomCounts[item.id_nhom] || 0) + 1;
      }
      if (passNhom && passTrangThai && item.id_noi_luu) {
        noiLuuCounts[item.id_noi_luu] = (noiLuuCounts[item.id_noi_luu] || 0) + 1;
      }
      if (passNhom && passNoiLuu && item.id_trang_thai) {
        trangThaiCounts[item.id_trang_thai] = (trangThaiCounts[item.id_trang_thai] || 0) + 1;
      }
    }

    return { nhomCounts, noiLuuCounts, trangThaiCounts };
  }, [items, filters]);
}
