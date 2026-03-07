import { useQuery } from '@tanstack/react-query';
import { getSoDuTheoKy, type GetSoDuTheoKyParams } from '../services/tai-khoan-service';

const QUERY_KEY_PREFIX = 'so-du-theo-ky';

export function useSoDuTheoKy(params: GetSoDuTheoKyParams | null) {
  return useQuery({
    queryKey: [QUERY_KEY_PREFIX, params?.tuNgay, params?.denNgay, params?.id_tai_khoan],
    queryFn: () => getSoDuTheoKy(params!),
    enabled: !!params && !!params.tuNgay && !!params.denNgay,
    staleTime: 1000 * 60 * 2,
  });
}
