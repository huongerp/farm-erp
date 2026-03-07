import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getTaiLieuList,
  getTaiLieuById,
  createTaiLieu,
  updateTaiLieu,
  deleteTaiLieuList,
  updateTaiLieuPhanQuyen,
  getTaiLieuGhimIds,
  toggleTaiLieuGhim,
} from '../services/tai-lieu-service';
import type { TaiLieuFormValues } from '../core/schema';

export const useTaiLieuList = () =>
  useQuery({
    queryKey: ['taiLieu'],
    queryFn: getTaiLieuList,
  });

export const useTaiLieuById = (id: string | null) =>
  useQuery({
    queryKey: ['taiLieu', id],
    queryFn: () => (id ? getTaiLieuById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useCreateTaiLieu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaiLieuFormValues) => createTaiLieu(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taiLieu'] });
      toast.success(i18n.t('taiLieu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTaiLieu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaiLieuFormValues }) => updateTaiLieu(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taiLieu'] });
      toast.success(i18n.t('taiLieu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteTaiLieuList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTaiLieuList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: ['taiLieu'] });
      toast.success(i18n.t('taiLieu.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useTaiLieuGhimIds = () =>
  useQuery({
    queryKey: ['taiLieuGhim'],
    queryFn: getTaiLieuGhimIds,
  });

export const useToggleTaiLieuGhim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idTaiLieu: string) => toggleTaiLieuGhim(idTaiLieu),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taiLieuGhim'] });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTaiLieuPhanQuyen = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, id_chuc_vu_xem }: { id: string; id_chuc_vu_xem: string[] }) =>
      updateTaiLieuPhanQuyen(id, id_chuc_vu_xem),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['taiLieu'] });
      qc.invalidateQueries({ queryKey: ['taiLieu', id] });
      toast.success(i18n.t('taiLieu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
