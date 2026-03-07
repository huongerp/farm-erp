import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getMauPhanHois,
  createMauPhanHoi,
  updateMauPhanHoi,
  deleteMauPhanHois,
  updateMauPhanHoiStatus,
} from '../services/mau-phan-hoi-service';
import { MauPhanHoiFormValues } from '../core/schema';

export const useMauPhanHois = () => {
  return useQuery({
    queryKey: ['mauPhanHoi'],
    queryFn: getMauPhanHois,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateMauPhanHoi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMauPhanHoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mauPhanHoi'] });
      toast.success(i18n.t('thietLapTuyenDung.mauPhanHoi.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateMauPhanHoi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MauPhanHoiFormValues }) =>
      updateMauPhanHoi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mauPhanHoi'] });
      toast.success(i18n.t('thietLapTuyenDung.mauPhanHoi.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateMauPhanHoiStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updateMauPhanHoiStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mauPhanHoi'] });
      toast.success(
        i18n.t('thietLapTuyenDung.mauPhanHoi.toast.statusUpdate', { count: variables.ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteMauPhanHois = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteMauPhanHois(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['mauPhanHoi'] });
      toast.success(
        i18n.t('thietLapTuyenDung.mauPhanHoi.toast.deleteSuccess', { count: ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
