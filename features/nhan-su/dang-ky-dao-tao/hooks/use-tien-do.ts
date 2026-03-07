import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { getTienDoByDangKy, markBaiHocDaXem } from '../services/dang-ky-dao-tao-service';

const QUERY_KEY = (idDangKy: string) => ['dangKyDaoTao', 'tienDo', idDangKy];

export const useTienDoByDangKy = (idDangKy: string | null) => {
  return useQuery({
    queryKey: QUERY_KEY(idDangKy ?? ''),
    queryFn: () => getTienDoByDangKy(idDangKy!),
    enabled: !!idDangKy,
  });
};

export const useMarkBaiHocDaXem = (idDangKy: string, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_bai_hoc: string) => markBaiHocDaXem(idDangKy, id_bai_hoc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY(idDangKy) });
      qc.invalidateQueries({ queryKey: ['dangKyDaoTao'] });
      toast.success(i18n.t('dangKyDaoTao.toast.daXem'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
