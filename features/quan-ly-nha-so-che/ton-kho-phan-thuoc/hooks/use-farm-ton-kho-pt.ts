import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getPhieuKhoPTHangNxHistory,
  getTonKhoPTMatrixByKhoIds,
  getTonKhoPTTheoKy,
} from '../services/farm-ton-kho-pt';
import type { TonKhoPTKyParams } from '../core/types';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';

export const FARM_TON_KHO_PT_QUERY_KEY = ['farmTonKhoPT'] as const;

/**
 * Tồn theo kỳ (kho × hàng). Key nằm dưới FARM_TON_KHO_PT_QUERY_KEY nên lưu phiếu xong tự làm mới;
 * `keepPreviousData` để đổi kỳ không chớp về skeleton.
 */
export function useFarmTonKhoPTTheoKy(params: TonKhoPTKyParams) {
  const bt = useKhoBienThe();
  const rangeOk = !params.tu || !params.den || params.tu <= params.den;
  return useQuery({
    queryKey: [...FARM_TON_KHO_PT_QUERY_KEY, bt.key, 'theoKy', params.tu, params.den, params.chiDaDuyet] as const,
    queryFn: () => getTonKhoPTTheoKy(bt, params),
    enabled: rangeOk,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

/**
 * Tồn hiện tại của MỘT kho (form phiếu kho hiện "Tồn kho" từng dòng). Chưa chọn kho thì không gọi —
 * `getTonKhoPTMatrixByKhoIds(bt, [])` nghĩa là tải mọi kho. Key nằm dưới FARM_TON_KHO_PT_QUERY_KEY nên
 * lưu phiếu xong tự làm mới.
 */
export function useFarmTonKhoPTTheoKho(khoId: string | null | undefined) {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...FARM_TON_KHO_PT_QUERY_KEY, bt.key, 'theoKho', khoId] as const,
    queryFn: () => getTonKhoPTMatrixByKhoIds(bt, [String(khoId)]),
    enabled: !!khoId,
    staleTime: 1000 * 30,
  });
}

export function useFarmPhieuKhoPTHangNxHistory(idHangHoa: string) {
  const bt = useKhoBienThe();
  const enabled = Boolean(idHangHoa?.trim() && !Number.isNaN(Number(idHangHoa)));
  return useQuery({
    queryKey: [...FARM_TON_KHO_PT_QUERY_KEY, bt.key, 'hangNxHistory', idHangHoa] as const,
    queryFn: () => getPhieuKhoPTHangNxHistory(bt, idHangHoa),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
