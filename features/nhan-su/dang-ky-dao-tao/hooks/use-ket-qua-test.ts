import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { DapAnNop } from '../services/dang-ky-dao-tao-service';
import { getKetQuaByDangKy, submitBaiTest } from '../services/dang-ky-dao-tao-service';

const QUERY_KEY = (idDangKy: string) => ['dangKyDaoTao', 'ketQuaTest', idDangKy];

export const useKetQuaByDangKy = (idDangKy: string | null) => {
  return useQuery({
    queryKey: QUERY_KEY(idDangKy ?? ''),
    queryFn: () => getKetQuaByDangKy(idDangKy!),
    enabled: !!idDangKy,
  });
};

export const useSubmitBaiTest = (
  idDangKy: string,
  onSuccess?: (dat: boolean) => void
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id_bai_test, dap_an }: { id_bai_test: string; dap_an: DapAnNop }) =>
      submitBaiTest(idDangKy, id_bai_test, dap_an),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY(idDangKy) });
      qc.invalidateQueries({ queryKey: ['dangKyDaoTao'] });
      if (data.dat) {
        toast.success(i18n.t('dangKyDaoTao.toast.testPassed'));
      } else {
        toast.warning(i18n.t('dangKyDaoTao.toast.testNotPassed'));
      }
      onSuccess?.(data.dat);
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
