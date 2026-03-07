import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getAssetGroups,
  createAssetGroup,
  updateAssetGroup,
  deleteAssetGroups,
  updateAssetGroupStatus,
} from '../services/nhom-tai-san-service';
import { AssetGroupFormValues } from '../core/schema';

export const useAssetGroups = () => {
  return useQuery({
    queryKey: ['assetGroups'],
    queryFn: getAssetGroups,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateAssetGroup = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetGroups'] });
      toast.success(i18n.t('thietLapTaiSan.nhomTaiSan.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateAssetGroup = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetGroupFormValues }) =>
      updateAssetGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetGroups'] });
      toast.success(i18n.t('thietLapTaiSan.nhomTaiSan.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateAssetGroupStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updateAssetGroupStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assetGroups'] });
      toast.success(i18n.t('thietLapTaiSan.nhomTaiSan.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteAssetGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteAssetGroups(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['assetGroups'] });
      toast.success(i18n.t('thietLapTaiSan.nhomTaiSan.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
