import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getAssetStatuses,
  createAssetStatus,
  updateAssetStatus,
  deleteAssetStatuses,
  updateAssetStatusStatus,
} from '../services/trang-thai-service';
import { AssetStatusFormValues } from '../core/schema';

export const useAssetStatuses = () => {
  return useQuery({
    queryKey: ['assetStatuses'],
    queryFn: getAssetStatuses,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateAssetStatus = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssetStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetStatuses'] });
      toast.success(i18n.t('thietLapTaiSan.trangThai.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateAssetStatus = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetStatusFormValues }) =>
      updateAssetStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetStatuses'] });
      toast.success(i18n.t('thietLapTaiSan.trangThai.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateAssetStatusStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updateAssetStatusStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assetStatuses'] });
      toast.success(i18n.t('thietLapTaiSan.trangThai.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteAssetStatuses = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteAssetStatuses(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['assetStatuses'] });
      toast.success(i18n.t('thietLapTaiSan.trangThai.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
