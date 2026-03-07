import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getTrangThaiTaiLieuList,
  createTrangThaiTaiLieu,
  updateTrangThaiTaiLieu,
  deleteTrangThaiTaiLieuList,
  updateTrangThaiTaiLieuStatus,
} from '../services/trang-thai-tai-lieu-service';
import type { TrangThaiTaiLieuFormValues } from '../core/schema';

export const useTrangThaiTaiLieuList = () =>
  useQuery({
    queryKey: ['trangThaiTaiLieu'],
    queryFn: getTrangThaiTaiLieuList,
  });

export const useCreateTrangThaiTaiLieu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TrangThaiTaiLieuFormValues) => createTrangThaiTaiLieu(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trangThaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.trangThai.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTrangThaiTaiLieu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrangThaiTaiLieuFormValues }) => updateTrangThaiTaiLieu(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trangThaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.trangThai.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTrangThaiTaiLieuStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) => updateTrangThaiTaiLieuStatus(ids, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['trangThaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.trangThai.toast.statusUpdate', { count: v.ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteTrangThaiTaiLieuList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTrangThaiTaiLieuList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: ['trangThaiTaiLieu'] });
      toast.success(i18n.t('thietLapTaiLieu.trangThai.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
