import { useMemo } from 'react';
import type { DuAn } from '../core/types';
import type { DuAnFilters } from '../store/useDuAnStore';

/**
 * Đếm số dự án theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 */
export function useDuAnFilterCounts(items: DuAn[], filters: DuAnFilters) {
  return useMemo(() => {
    const statusCounts: Record<string, number> = { Active: 0, Inactive: 0 };
    const phongBanCounts: Record<string, number> = {};
    const namCounts: Record<string, number> = {};

    const matchStatus = (d: DuAn) =>
      (filters.status?.length ?? 0) === 0 ||
      (filters.status?.includes('Active') && d.trang_thai === 1) ||
      (filters.status?.includes('Inactive') && d.trang_thai === 0);
    const matchPhongBan = (d: DuAn) => {
      const arr = filters.id_phong_ban ?? [];
      if (arr.length === 0) return true;
      const ids = Array.isArray(d.id_phong_ban) ? d.id_phong_ban : d.id_phong_ban ? [d.id_phong_ban] : [];
      return ids.some((id) => arr.includes(id));
    };
    const matchNam = (d: DuAn) => {
      const arr = filters.nam_bat_dau ?? [];
      if (arr.length === 0) return true;
      const y = d.ngay_bat_dau ? String(new Date(d.ngay_bat_dau).getFullYear()) : '';
      return y && arr.includes(y);
    };

    for (const d of items) {
      const passStatus = matchStatus(d);
      const passPhongBan = matchPhongBan(d);
      const passNam = matchNam(d);

      if (passPhongBan && passNam) {
        const k = d.trang_thai === 1 ? 'Active' : 'Inactive';
        statusCounts[k] = (statusCounts[k] ?? 0) + 1;
      }
      if (passStatus && passNam) {
        const ids = Array.isArray(d.id_phong_ban) ? d.id_phong_ban : d.id_phong_ban ? [d.id_phong_ban] : [];
        for (const id of ids) {
          phongBanCounts[id] = (phongBanCounts[id] || 0) + 1;
        }
      }
      if (passStatus && passPhongBan && d.ngay_bat_dau) {
        const y = String(new Date(d.ngay_bat_dau).getFullYear());
        namCounts[y] = (namCounts[y] || 0) + 1;
      }
    }

    return { statusCounts, phongBanCounts, namCounts };
  }, [items, filters]);
}
