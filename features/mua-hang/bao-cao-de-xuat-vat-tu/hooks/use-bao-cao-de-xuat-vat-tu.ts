import { useQuery } from '@tanstack/react-query';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import {
  getPhieuDeXuatInPeriod,
  getTongHopDeXuatKy,
  getLienKetDonHang,
} from '../services/bao-cao-de-xuat-vat-tu-service';

const QUERY_KEY = ['baoCaodeXuatVatTu'] as const;

export function usePhieuDeXuatInPeriod(filters: BaoCaoDeXuatVatTuFilters | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'phieuInPeriod', filters],
    queryFn: () => getPhieuDeXuatInPeriod(filters!),
    enabled: !!filters && !!filters.dateFrom && !!filters.dateTo,
  });
}

export function useTongHopDeXuatKy(filters: BaoCaoDeXuatVatTuFilters | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'tongHopKy', filters],
    queryFn: () => getTongHopDeXuatKy(filters!),
    enabled: !!filters && !!filters.dateFrom && !!filters.dateTo,
  });
}

export function useLienKetDonHang(filters: BaoCaoDeXuatVatTuFilters | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'lienKetDonHang', filters],
    queryFn: () => getLienKetDonHang(filters!),
    enabled: !!filters && !!filters.dateFrom && !!filters.dateTo,
  });
}
