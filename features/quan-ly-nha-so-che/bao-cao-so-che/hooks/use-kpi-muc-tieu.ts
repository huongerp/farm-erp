import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  fetchKpiMucTieuCaiDat,
  luuKpiMucTieu,
  type LuuKpiMucTieuInput,
} from '../services/kpi-muc-tieu.service';
import { QUERY_KEY_BAO_CAO_SO_CHE } from './use-bao-cao-so-che';

/** Nằm dưới khoá `baoCaoSoChe` → lưu cài đặt invalidate cả danh sách / chi tiết phiếu. */
export const QUERY_KEY_KPI_MUC_TIEU = [...QUERY_KEY_BAO_CAO_SO_CHE, 'kpiMucTieu'] as const;

/** Mục tiêu KPI theo farm × ngày hiệu lực (super admin cài; form phiếu đọc để khoá mục tiêu). */
export function useKpiMucTieuCaiDat(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY_KPI_MUC_TIEU,
    queryFn: fetchKpiMucTieuCaiDat,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLuuKpiMucTieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LuuKpiMucTieuInput) => luuKpiMucTieu(input),
    onSuccess: (soPhieu) => {
      // Khoá gốc baoCaoSoChe: cài đặt + danh sách + chi tiết phiếu; thống kê sản xuất đọc thưởng đã lưu.
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      qc.invalidateQueries({ queryKey: ['thongKeSanXuat'] });
      toast.success(i18n.t('baoCaoSoChe.caiDatKpi.daLuu', { soPhieu }));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
