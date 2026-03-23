import { useQuery } from '@tanstack/react-query';
import type { NXTReportFilters } from '../core/types';
import { getNXTByPeriod, getPhieuInPeriod, getTonAtDate } from '../services/bao-cao-nxt-service';

export function useNXTByPeriod(filters: NXTReportFilters | null) {
  return useQuery({
    queryKey: ['baoCaonhapXuatTon', 'nxtByPeriod', filters],
    queryFn: () => getNXTByPeriod(filters!),
    enabled: !!filters && !!filters.dateFrom && !!filters.dateTo,
  });
}

export function usePhieuInPeriod(filters: NXTReportFilters | null) {
  return useQuery({
    queryKey: ['baoCaonhapXuatTon', 'phieuInPeriod', filters],
    queryFn: () => getPhieuInPeriod(filters!),
    enabled: !!filters && !!filters.dateFrom && !!filters.dateTo,
  });
}

export function useTonAtDate(
  filters: Pick<NXTReportFilters, 'warehouseIds' | 'hangHoaIds' | 'categoryIds' | 'allowedBranchIds'> | null
) {
  return useQuery({
    queryKey: ['baoCaonhapXuatTon', 'tonAtDate', filters],
    queryFn: () =>
      getTonAtDate(
        filters ?? { warehouseIds: [], hangHoaIds: [], categoryIds: [] }
      ),
    enabled: true,
  });
}
