import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getThuGuiUngViens,
  createThuGuiUngVien,
  updateThuGuiUngVien,
  deleteThuGuiUngViens,
} from '../services/thu-gui-ung-vien-service';
import type { ThuGuiUngVienFormValues } from '../core/types';

const QUERY_KEY = ['thuGuiUngVien'];

export const useThuGuiUngViens = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getThuGuiUngViens,
    staleTime: 1000 * 60 * 3,
  });
};

export const useCreateThuGuiUngVien = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ThuGuiUngVienFormValues) => createThuGuiUngVien(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thuGuiUngVien.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateThuGuiUngVien = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThuGuiUngVienFormValues> }) =>
      updateThuGuiUngVien(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thuGuiUngVien.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteThuGuiUngViens = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteThuGuiUngViens(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thuGuiUngVien.toast.deleteSuccess', { count: ids.length }));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
