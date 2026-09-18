import { useQuery } from '@tanstack/react-query';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { getThongKeQuyStats } from '../services/thong-ke-quy-service';
import type { ThongKeQuyParams } from '../core/types';

export const THONG_KE_QUY_QUERY_KEY = ['thongKeQuy'] as const;

export const useThongKeQuyStats = (params: ThongKeQuyParams, enabled = true) =>
  useQuery({
    queryKey: [...THONG_KE_QUY_QUERY_KEY, stableListQueryKeyPart(params)],
    queryFn: () => getThongKeQuyStats(params),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
