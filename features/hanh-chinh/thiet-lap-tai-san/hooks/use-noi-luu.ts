import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getAssetStorageLocations,
  createAssetStorageLocation,
  updateAssetStorageLocation,
  deleteAssetStorageLocations,
  updateAssetStorageLocationStatus,
} from '../services/noi-luu-service';
import { AssetStorageLocationFormValues } from '../core/schema';

export const useAssetStorageLocations = () => {
  return useQuery({
    queryKey: ['assetStorageLocations'],
    queryFn: getAssetStorageLocations,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateAssetStorageLocation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssetStorageLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetStorageLocations'] });
      toast.success(i18n.t('thietLapTaiSan.noiLuu.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateAssetStorageLocation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetStorageLocationFormValues }) =>
      updateAssetStorageLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetStorageLocations'] });
      toast.success(i18n.t('thietLapTaiSan.noiLuu.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateAssetStorageLocationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: import('../../../../lib/constants').TrangThaiHoatDong }) =>
      updateAssetStorageLocationStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assetStorageLocations'] });
      toast.success(i18n.t('thietLapTaiSan.noiLuu.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteAssetStorageLocations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteAssetStorageLocations(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['assetStorageLocations'] });
      toast.success(i18n.t('thietLapTaiSan.noiLuu.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
