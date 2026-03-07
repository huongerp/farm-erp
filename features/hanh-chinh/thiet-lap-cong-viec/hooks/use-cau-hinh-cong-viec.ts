import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { getCauHinhCongViec, saveCauHinhCongViec } from '../services/cau-hinh-cong-viec-service';
import type { CauHinhCongViecFormValues } from '../core/schema';

export const CAU_HINH_QUERY_KEY = ['cauHinhCongViec'];

export const useCauHinhCongViec = () =>
  useQuery({
    queryKey: CAU_HINH_QUERY_KEY,
    queryFn: getCauHinhCongViec,
  });

export const useSaveCauHinhCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CauHinhCongViecFormValues) => saveCauHinhCongViec(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAU_HINH_QUERY_KEY });
      toast.success(i18n.t('thietLapCongViec.canhBao.toast.saveSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
