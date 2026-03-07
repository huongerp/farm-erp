import { useMemo } from 'react';
import type { AdminFormRequest } from '../core/types';

export interface AdminFormFilters {
  status: string[];
  type: string[];
  shift: string[];
  month: string;
}

/**
 * Đếm số phiếu theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 */
export function useAdminFormFilterCounts(
  items: AdminFormRequest[],
  filters: AdminFormFilters,
) {
  return useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const shiftCounts: Record<string, number> = {};

    const matchStatus = (f: AdminFormRequest) =>
      filters.status.length === 0 || filters.status.includes(f.trang_thai);
    const matchType = (f: AdminFormRequest) =>
      filters.type.length === 0 || filters.type.includes(f.loai_phieu);
    const matchShift = (f: AdminFormRequest) =>
      filters.shift.length === 0 || filters.shift.includes(f.ca);
    const matchMonth = (f: AdminFormRequest) =>
      !filters.month || f.ngay.startsWith(filters.month);

    for (const f of items) {
      const passStatus = matchStatus(f);
      const passType = matchType(f);
      const passShift = matchShift(f);
      const passMonth = matchMonth(f);

      if (passType && passShift && passMonth) {
        statusCounts[f.trang_thai] = (statusCounts[f.trang_thai] || 0) + 1;
      }
      if (passStatus && passShift && passMonth) {
        typeCounts[f.loai_phieu] = (typeCounts[f.loai_phieu] || 0) + 1;
      }
      if (passStatus && passType && passMonth) {
        shiftCounts[f.ca] = (shiftCounts[f.ca] || 0) + 1;
      }
    }

    return { statusCounts, typeCounts, shiftCounts };
  }, [items, filters]);
}
