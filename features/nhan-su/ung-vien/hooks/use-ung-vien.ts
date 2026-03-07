import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getUngViens,
  createUngVien,
  updateUngVien,
  deleteUngViens,
} from '../services/ung-vien-service';
import type { UngVienFormValues } from '../core/schema';

const QUERY_KEY = ['ungVien'];

export const useUngViens = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getUngViens,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateUngVien = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UngVienFormValues) => createUngVien(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('ungVien.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateUngVien = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UngVienFormValues }) =>
      updateUngVien(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('ungVien.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteUngViens = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteUngViens(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('ungVien.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
