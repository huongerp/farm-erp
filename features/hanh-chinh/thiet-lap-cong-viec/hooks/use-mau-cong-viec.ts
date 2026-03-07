import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getMauCongViecList,
  createMauCongViec,
  updateMauCongViec,
  deleteMauCongViecList,
  updateMauCongViecStatus,
} from '../services/mau-cong-viec-service';
import type { MauCongViecFormValues } from '../core/schema';

export const MAU_CONG_VIEC_QUERY_KEY = ['mauCongViec'];

export const useMauCongViecList = () =>
  useQuery({
    queryKey: MAU_CONG_VIEC_QUERY_KEY,
    queryFn: getMauCongViecList,
  });

export const useCreateMauCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MauCongViecFormValues) => createMauCongViec(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAU_CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('thietLapCongViec.mau.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateMauCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MauCongViecFormValues }) =>
      updateMauCongViec(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAU_CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('thietLapCongViec.mau.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateMauCongViecStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updateMauCongViecStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAU_CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('thietLapCongViec.mau.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteMauCongViecList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteMauCongViecList(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAU_CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('thietLapCongViec.mau.toast.deleteSuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
