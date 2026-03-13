import { useMemo } from 'react';
import type { CongViec } from '../core/types';
import type { CongViecFilters } from '../store/useCongViecStore';

/**
 * Đếm số công việc theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 * items = danh sách công việc người dùng được xem (sau scope/phân quyền).
 */
export function useCongViecFilterCounts(items: CongViec[], filters: CongViecFilters) {
  return useMemo(() => {
    const trangThaiCounts: Record<string, number> = {};
    const uuTienCounts: Record<string, number> = {};
    const trachNhiemCounts: Record<string, number> = {};

    const matchTrangThai = (c: CongViec) =>
      (filters.trang_thai?.length ?? 0) === 0 || (filters.trang_thai?.includes(c.trang_thai) ?? false);
    const matchUuTien = (c: CongViec) =>
      (filters.uu_tien?.length ?? 0) === 0 || (filters.uu_tien?.includes(c.uu_tien) ?? false);
    const matchTrachNhiem = (c: CongViec) =>
      (filters.trach_nhiem?.length ?? 0) === 0 ||
      (c.trach_nhiem != null && (filters.trach_nhiem?.includes(c.trach_nhiem) ?? false));

    for (const c of items) {
      const passTrangThai = matchTrangThai(c);
      const passUuTien = matchUuTien(c);
      const passTrachNhiem = matchTrachNhiem(c);

      if (passUuTien && passTrachNhiem) {
        trangThaiCounts[c.trang_thai] = (trangThaiCounts[c.trang_thai] || 0) + 1;
      }
      if (passTrangThai && passTrachNhiem) {
        uuTienCounts[c.uu_tien] = (uuTienCounts[c.uu_tien] || 0) + 1;
      }
      if (passTrangThai && passUuTien && c.trach_nhiem != null) {
        const key = String(c.trach_nhiem);
        trachNhiemCounts[key] = (trachNhiemCounts[key] || 0) + 1;
      }
    }

    return { trangThaiCounts, uuTienCounts, trachNhiemCounts };
  }, [items, filters]);
}
