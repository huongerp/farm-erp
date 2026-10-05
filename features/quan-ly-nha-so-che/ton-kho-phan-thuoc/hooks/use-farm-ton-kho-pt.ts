import { useQuery } from '@tanstack/react-query';
import {
  getTonKhoPTDisplayRows,
  getNXTPTByPeriod,
  getNXTPTProductWarehouseBreakdown,
  getPhieuKhoPTHangNxHistory,
  getTonKhoPTMatrixByKhoIds,
} from '../services/farm-ton-kho-pt';
import type { NXTPTFilters } from '../core/types';

export const FARM_TON_KHO_PT_QUERY_KEY = ['farmTonKhoPT'] as const;

export function useFarmTonKhoPTDisplay() {
  return useQuery({
    queryKey: FARM_TON_KHO_PT_QUERY_KEY,
    queryFn: getTonKhoPTDisplayRows,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Tồn hiện tại của MỘT kho (form phiếu kho hiện "Tồn kho" từng dòng). Chưa chọn kho thì không gọi —
 * `getTonKhoPTMatrixByKhoIds([])` nghĩa là tải mọi kho. Key nằm dưới FARM_TON_KHO_PT_QUERY_KEY nên
 * lưu phiếu xong tự làm mới.
 */
export function useFarmTonKhoPTTheoKho(khoId: string | null | undefined) {
  return useQuery({
    queryKey: [...FARM_TON_KHO_PT_QUERY_KEY, 'theoKho', khoId] as const,
    queryFn: () => getTonKhoPTMatrixByKhoIds([String(khoId)]),
    enabled: !!khoId,
    staleTime: 1000 * 30,
  });
}

export function isNXTDateRangeValid(filters: NXTPTFilters): boolean {
  const { dateFrom, dateTo } = filters;
  if (!dateFrom || !dateTo) return false;
  return dateFrom <= dateTo;
}

export function useFarmNXTPT(filters: NXTPTFilters, enabled: boolean) {
  const rangeOk = isNXTDateRangeValid(filters);
  return useQuery({
    queryKey: [...FARM_TON_KHO_PT_QUERY_KEY, 'nxt', filters] as const,
    queryFn: () => getNXTPTByPeriod(filters),
    enabled: enabled && rangeOk,
    staleTime: 1000 * 60,
  });
}

export function useFarmNXTPTProductWarehouse(filters: NXTPTFilters, idHangHoa: string | null, enabled: boolean) {
  const rangeOk = isNXTDateRangeValid(filters);
  const q = Boolean(idHangHoa?.trim() && enabled && rangeOk);
  return useQuery({
    queryKey: [...FARM_TON_KHO_PT_QUERY_KEY, 'nxtProductWh', filters, idHangHoa] as const,
    queryFn: () => getNXTPTProductWarehouseBreakdown(filters, idHangHoa!),
    enabled: q,
    staleTime: 1000 * 60,
  });
}

export function useFarmPhieuKhoPTHangNxHistory(idHangHoa: string) {
  const enabled = Boolean(idHangHoa?.trim() && !Number.isNaN(Number(idHangHoa)));
  return useQuery({
    queryKey: [...FARM_TON_KHO_PT_QUERY_KEY, 'hangNxHistory', idHangHoa] as const,
    queryFn: () => getPhieuKhoPTHangNxHistory(idHangHoa),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
