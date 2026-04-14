import { useMemo } from 'react';
import { useAllTonKho } from '../../hooks/use-ton-kho';
import { getKhoList } from '../../../danh-sach-kho/services/kho-service';
import { getAllHangHoa } from '../../../danh-sach-hang-hoa/services/hang-hoa-service';
import { useQuery } from '@tanstack/react-query';
import { HANG_HOA_QUERY_KEY } from '../../../danh-sach-hang-hoa/hooks/use-hang-hoa';
import type { TonKhoRecord } from '../../../phieu-kho/services/ton-kho-service';
import type { Kho } from '../../../danh-sach-kho/core/types';
import type { HangHoa } from '../../../danh-sach-hang-hoa/core/types';

export interface TonKhoStatsSummary {
  totalStock: number;
  warehouseCount: number;
  productCount: number;
}

export interface TonKhoStats {
  summary: TonKhoStatsSummary;
  byWarehouse: { name: string; value: number }[];
  topProducts: { name: string; value: number }[];
}

/** Pure: tính thống kê từ danh sách tồn + kho + hàng hóa. */
export function computeTonKhoStats(
  tonKhoList: TonKhoRecord[],
  khoList: Kho[],
  hangHoaList: HangHoa[]
): TonKhoStats | null {
  if (!tonKhoList.length) return null;
  let total = 0;
  const totalByKho = new Map<string, number>();
  const totalByHangHoa = new Map<string, number>();
  const khoIds = new Set<string>();
  const hangHoaIds = new Set<string>();
  tonKhoList.forEach((r) => {
    total += r.so_luong;
    khoIds.add(r.id_kho);
    hangHoaIds.add(r.id_hang_hoa);
    totalByKho.set(r.id_kho, (totalByKho.get(r.id_kho) ?? 0) + r.so_luong);
    totalByHangHoa.set(r.id_hang_hoa, (totalByHangHoa.get(r.id_hang_hoa) ?? 0) + r.so_luong);
  });
  const khoMap: Record<string, string> = {};
  khoList.forEach((k) => { khoMap[k.id] = k.ten_kho; });
  const hangHoaMap: Record<string, { ma: string; ten: string }> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = { ma: h.ma_hang, ten: h.ten_hang }; });
  const byWarehouse = Array.from(totalByKho.entries())
    .map(([id, value]) => ({ name: khoMap[id] ?? id, value }))
    .sort((a, b) => b.value - a.value);
  const topProducts = Array.from(totalByHangHoa.entries())
    .map(([id, value]) => {
      const h = hangHoaMap[id];
      return { name: h ? `${h.ma} - ${h.ten}` : id, value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  return {
    summary: { totalStock: total, warehouseCount: khoIds.size, productCount: hangHoaIds.size },
    byWarehouse,
    topProducts,
  };
}

export function useTonKhoStats(): { stats: TonKhoStats | null; isLoading: boolean } {
  const { data: tonKhoList = [], isLoading: loadingTonKho } = useAllTonKho();
  const { data: khoList = [] } = useQuery<Kho[]>({
    queryKey: ['kho'],
    queryFn: getKhoList,
    staleTime: 1000 * 60 * 30,
  });
  const { data: hangHoaList = [] } = useQuery<HangHoa[]>({
    queryKey: HANG_HOA_QUERY_KEY,
    queryFn: getAllHangHoa,
    staleTime: 1000 * 60 * 15,
  });

  const stats = useMemo(
    () => computeTonKhoStats(tonKhoList, khoList, hangHoaList),
    [tonKhoList, khoList, hangHoaList]
  );

  return { stats, isLoading: loadingTonKho };
}
