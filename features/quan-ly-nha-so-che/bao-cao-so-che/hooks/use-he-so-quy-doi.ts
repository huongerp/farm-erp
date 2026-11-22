import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  fetchCaiDatHeSo,
  fetchHeSoQuyDoiGoiY,
  luuCaiDatHeSo,
  type CaiDatHeSoDong,
} from '../services/he-so-quy-doi.service';
import { QUERY_KEY_BAO_CAO_SO_CHE } from './use-bao-cao-so-che';

/** Nằm dưới khoá `baoCaoSoChe` → tạo / sửa phiếu invalidate là có hệ số mới ngay. */
export const QUERY_KEY_HE_SO_QUY_DOI = [...QUERY_KEY_BAO_CAO_SO_CHE, 'heSoQuyDoi'] as const;

export function useHeSoQuyDoiGoiY(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY_HE_SO_QUY_DOI,
    queryFn: fetchHeSoQuyDoiGoiY,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/** Cài đặt hệ số theo farm × phẩm cấp (admin cài; form phiếu đọc để tự điền). */
export function useCaiDatHeSo(enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_HE_SO_QUY_DOI, 'caiDat'],
    queryFn: fetchCaiDatHeSo,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLuuCaiDatHeSo(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idChiNhanh, rows }: { idChiNhanh: string | number; rows: CaiDatHeSoDong[] }) =>
      luuCaiDatHeSo(idChiNhanh, rows),
    onSuccess: () => {
      // Invalidate cả khoá gốc để dialog + form phiếu (đang mở) nhận số mới.
      qc.invalidateQueries({ queryKey: QUERY_KEY_HE_SO_QUY_DOI });
      toast.success(i18n.t('baoCaoSoChe.caiDatHeSo.daLuu'));
      onDone?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
