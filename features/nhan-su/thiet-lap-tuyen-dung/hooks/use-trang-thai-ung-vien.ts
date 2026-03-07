import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getTrangThaiUngViens,
  createTrangThaiUngVien,
  updateTrangThaiUngVien,
  deleteTrangThaiUngViens,
  updateTrangThaiUngVienStatus,
} from '../services/trang-thai-ung-vien-service';
import { TrangThaiUngVienFormValues } from '../core/schema';

export const useTrangThaiUngViens = () => {
  return useQuery({
    queryKey: ['trangThaiUngVien'],
    queryFn: getTrangThaiUngViens,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateTrangThaiUngVien = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrangThaiUngVien,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trangThaiUngVien'] });
      toast.success(i18n.t('thietLapTuyenDung.trangThaiUngVien.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateTrangThaiUngVien = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrangThaiUngVienFormValues }) =>
      updateTrangThaiUngVien(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trangThaiUngVien'] });
      toast.success(i18n.t('thietLapTuyenDung.trangThaiUngVien.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateTrangThaiUngVienStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updateTrangThaiUngVienStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trangThaiUngVien'] });
      toast.success(
        i18n.t('thietLapTuyenDung.trangThaiUngVien.toast.statusUpdate', { count: variables.ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteTrangThaiUngViens = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTrangThaiUngViens(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['trangThaiUngVien'] });
      toast.success(
        i18n.t('thietLapTuyenDung.trangThaiUngVien.toast.deleteSuccess', { count: ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
