import { useQuery } from '@tanstack/react-query';
import { fetchHeSoQuyDoiGoiY } from '../services/he-so-quy-doi.service';
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
