import { useMemo } from 'react';
import type { DiemCongTruRecord } from '../core/types';
import type { DiemCongTruFilters } from '../store/useDiemCongTruStore';

function periodStr(r: DiemCongTruRecord): string {
  return `${r.nam}-${String(r.thang).padStart(2, '0')}`;
}

/**
 * Đếm số bản ghi theo loại (cộng/trừ). Khi đếm loại chỉ áp dụng filter yearMonth (exclude-self).
 */
export function useDiemCongTruFilterCounts(items: DiemCongTruRecord[], filters: DiemCongTruFilters) {
  return useMemo(() => {
    const typeCounts: Record<string, number> = {};
    for (const r of items) {
      const matchYearMonth = !filters.yearMonth || periodStr(r).startsWith(filters.yearMonth);
      if (matchYearMonth && r.loai) {
        typeCounts[r.loai] = (typeCounts[r.loai] || 0) + 1;
      }
    }
    return { typeCounts };
  }, [items, filters]);
}
