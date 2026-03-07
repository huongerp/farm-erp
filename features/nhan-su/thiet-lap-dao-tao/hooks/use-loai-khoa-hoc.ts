import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getLoaiKhoaHocs,
  createLoaiKhoaHoc,
  updateLoaiKhoaHoc,
  deleteLoaiKhoaHocs,
  updateLoaiKhoaHocStatus,
} from '../services/loai-khoa-hoc-service';
import { LoaiKhoaHocFormValues } from '../core/schema';

export const useLoaiKhoaHocs = () => {
  return useQuery({
    queryKey: ['loaiKhoaHoc'],
    queryFn: getLoaiKhoaHocs,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateLoaiKhoaHoc = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLoaiKhoaHoc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loaiKhoaHoc'] });
      toast.success(i18n.t('thietLapDaoTao.loaiKhoaHoc.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateLoaiKhoaHoc = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoaiKhoaHocFormValues }) =>
      updateLoaiKhoaHoc(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loaiKhoaHoc'] });
      toast.success(i18n.t('thietLapDaoTao.loaiKhoaHoc.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateLoaiKhoaHocStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updateLoaiKhoaHocStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loaiKhoaHoc'] });
      toast.success(
        i18n.t('thietLapDaoTao.loaiKhoaHoc.toast.statusUpdate', { count: variables.ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteLoaiKhoaHocs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteLoaiKhoaHocs(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['loaiKhoaHoc'] });
      toast.success(
        i18n.t('thietLapDaoTao.loaiKhoaHoc.toast.deleteSuccess', { count: ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
