import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getKenhTuyenDungs,
  createKenhTuyenDung,
  updateKenhTuyenDung,
  deleteKenhTuyenDungs,
  updateKenhTuyenDungStatus,
} from '../services/kenh-tuyen-dung-service';
import { KenhTuyenDungFormValues } from '../core/schema';

export const useKenhTuyenDungs = () => {
  return useQuery({
    queryKey: ['kenhTuyenDung'],
    queryFn: getKenhTuyenDungs,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateKenhTuyenDung = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKenhTuyenDung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kenhTuyenDung'] });
      toast.success(i18n.t('thietLapTuyenDung.kenhTuyenDung.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateKenhTuyenDung = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KenhTuyenDungFormValues }) =>
      updateKenhTuyenDung(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kenhTuyenDung'] });
      toast.success(i18n.t('thietLapTuyenDung.kenhTuyenDung.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateKenhTuyenDungStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updateKenhTuyenDungStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kenhTuyenDung'] });
      toast.success(
        i18n.t('thietLapTuyenDung.kenhTuyenDung.toast.statusUpdate', { count: variables.ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteKenhTuyenDungs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteKenhTuyenDungs(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['kenhTuyenDung'] });
      toast.success(
        i18n.t('thietLapTuyenDung.kenhTuyenDung.toast.deleteSuccess', { count: ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
