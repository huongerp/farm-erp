import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getLichPhongVans,
  createLichPhongVan,
  updateLichPhongVan,
  deleteLichPhongVans,
} from '../services/lich-phong-van-service';
import type { LichPhongVanFormValues } from '../core/schema';

const QUERY_KEY = ['lichPhongVan'];

export const useLichPhongVans = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getLichPhongVans,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateLichPhongVan = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LichPhongVanFormValues) => createLichPhongVan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('lichPhongVan.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateLichPhongVan = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LichPhongVanFormValues }) =>
      updateLichPhongVan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('lichPhongVan.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteLichPhongVans = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteLichPhongVans(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('lichPhongVan.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
