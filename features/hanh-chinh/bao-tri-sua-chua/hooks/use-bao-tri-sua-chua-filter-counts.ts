import { useMemo } from 'react';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { BaoTriSuaChuaFilters } from '../store/useBaoTriSuaChuaStore';

/**
 * Đếm số phiếu theo từng giá trị filter (exclude-self) để hiển thị count trong filter chip.
 */
export function useBaoTriSuaChuaFilterCounts(
  list: PhieuBaoTriSuaChua[],
  filters: BaoTriSuaChuaFilters,
) {
  return useMemo(() => {
    const hangMucCounts: Record<string, number> = {};
    const taiSanCounts: Record<string, number> = {};

    const matchHangMuc = (p: PhieuBaoTriSuaChua) =>
      filters.hang_muc.length === 0 || filters.hang_muc.includes(p.hang_muc);
    const matchDateFrom = (p: PhieuBaoTriSuaChua) =>
      !filters.dateFrom || p.ngay_yeu_cau >= filters.dateFrom;
    const matchDateTo = (p: PhieuBaoTriSuaChua) =>
      !filters.dateTo || p.ngay_yeu_cau <= filters.dateTo;
    const matchTaiSan = (p: PhieuBaoTriSuaChua) =>
      filters.id_tai_san.length === 0 || filters.id_tai_san.includes(p.id_tai_san);

    for (const p of list) {
      const passDate = matchDateFrom(p) && matchDateTo(p);
      const passTaiSan = matchTaiSan(p);

      if (passDate && passTaiSan) {
        hangMucCounts[p.hang_muc] = (hangMucCounts[p.hang_muc] || 0) + 1;
      }
      if (matchHangMuc(p) && passDate) {
        taiSanCounts[p.id_tai_san] = (taiSanCounts[p.id_tai_san] || 0) + 1;
      }
    }

    return { hangMucCounts, taiSanCounts };
  }, [list, filters]);
}
