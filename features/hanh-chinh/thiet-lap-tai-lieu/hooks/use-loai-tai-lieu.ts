import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getLoaiTaiLieuList,
  createLoaiTaiLieu,
  updateLoaiTaiLieu,
  deleteLoaiTaiLieuList,
  updateLoaiTaiLieuStatus,
} from '../services/loai-tai-lieu-service';
import type { LoaiTaiLieuFormValues } from '../core/schema';

export const useLoaiTaiLieuList = () =>
  useQuery({
    queryKey: ['loaiTaiLieu'],
    queryFn: getLoaiTaiLieuList,
  });

export const useCreateLoaiTaiLieu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoaiTaiLieuFormValues) => createLoaiTaiLieu(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.loai.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateLoaiTaiLieu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoaiTaiLieuFormValues }) => updateLoaiTaiLieu(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.loai.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateLoaiTaiLieuStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) => updateLoaiTaiLieuStatus(ids, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['loaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.loai.toast.statusUpdate', { count: v.ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteLoaiTaiLieuList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteLoaiTaiLieuList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: ['loaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.loai.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
