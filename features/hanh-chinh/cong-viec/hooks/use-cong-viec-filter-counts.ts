import { useMemo } from 'react';
import type { CongViec } from '../core/types';
import type { CongViecFilters } from '../store/useCongViecStore';

/**
 * Đếm số công việc theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 * items = danh sách công việc người dùng được xem (sau scope/phân quyền).
 */
export function useCongViecFilterCounts(items: CongViec[], filters: CongViecFilters) {
  return useMemo(() => {
    const duAnCounts: Record<string, number> = {};
    const trangThaiCounts: Record<string, number> = {};
    const uuTienCounts: Record<string, number> = {};
    const nguoiThucHienCounts: Record<string, number> = {};

    const matchDuAn = (c: CongViec) =>
      (filters.id_du_an?.length ?? 0) === 0 ||
      (c.id_du_an && filters.id_du_an?.includes(c.id_du_an));
    const matchTrangThai = (c: CongViec) =>
      (filters.trang_thai?.length ?? 0) === 0 || (filters.trang_thai?.includes(c.trang_thai) ?? false);
    const matchUuTien = (c: CongViec) =>
      (filters.uu_tien?.length ?? 0) === 0 || (filters.uu_tien?.includes(c.uu_tien) ?? false);
    const matchNguoi = (c: CongViec) =>
      (filters.nguoi_thuc_hien?.length ?? 0) === 0 ||
      (c.danh_sach_nguoi_thuc_hien?.some((id) => filters.nguoi_thuc_hien?.includes(id)) ?? false);

    for (const c of items) {
      const passDuAn = matchDuAn(c);
      const passTrangThai = matchTrangThai(c);
      const passUuTien = matchUuTien(c);
      const passNguoi = matchNguoi(c);

      if (passTrangThai && passUuTien && passNguoi && c.id_du_an) {
        duAnCounts[c.id_du_an] = (duAnCounts[c.id_du_an] || 0) + 1;
      }
      if (passDuAn && passUuTien && passNguoi) {
        trangThaiCounts[c.trang_thai] = (trangThaiCounts[c.trang_thai] || 0) + 1;
      }
      if (passDuAn && passTrangThai && passNguoi) {
        uuTienCounts[c.uu_tien] = (uuTienCounts[c.uu_tien] || 0) + 1;
      }
      if (passDuAn && passTrangThai && passUuTien && c.danh_sach_nguoi_thuc_hien?.length) {
        for (const id of c.danh_sach_nguoi_thuc_hien) {
          nguoiThucHienCounts[id] = (nguoiThucHienCounts[id] || 0) + 1;
        }
      }
    }

    return { duAnCounts, trangThaiCounts, uuTienCounts, nguoiThucHienCounts };
  }, [items, filters]);
}
