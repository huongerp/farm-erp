import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getHoSoList,
  getHoSoById,
  getHoSoByTaiLieuId,
  createHoSo,
  updateHoSo,
  deleteHoSoList,
  getHoSoGhimIds,
  toggleHoSoGhim,
} from '../services/ho-so-service';
import type { HoSoFormValues } from '../core/schema';

export const useHoSoList = (opts?: { id_tai_lieu?: string }) =>
  useQuery({
    queryKey: ['hoSo', opts?.id_tai_lieu],
    queryFn: () => getHoSoList(opts),
  });

export const useHoSoByTaiLieuId = (idTaiLieu: string | null) =>
  useQuery({
    queryKey: ['hoSo', 'byTaiLieu', idTaiLieu],
    queryFn: () => (idTaiLieu ? getHoSoByTaiLieuId(idTaiLieu) : Promise.resolve([])),
    enabled: !!idTaiLieu,
  });

export const useHoSoById = (id: string | null) =>
  useQuery({
    queryKey: ['hoSo', id],
    queryFn: () => (id ? getHoSoById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useCreateHoSo = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HoSoFormValues) => createHoSo(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hoSo'] });
      toast.success(i18n.t('hoSo.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateHoSo = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HoSoFormValues }) => updateHoSo(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['hoSo'] });
      qc.invalidateQueries({ queryKey: ['hoSo', id] });
      toast.success(i18n.t('hoSo.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteHoSoList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteHoSoList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: ['hoSo'] });
      toast.success(i18n.t('hoSo.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useHoSoGhimIds = () =>
  useQuery({
    queryKey: ['hoSoGhim'],
    queryFn: getHoSoGhimIds,
  });

export const useToggleHoSoGhim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idHoSo: string) => toggleHoSoGhim(idHoSo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hoSoGhim'] });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
