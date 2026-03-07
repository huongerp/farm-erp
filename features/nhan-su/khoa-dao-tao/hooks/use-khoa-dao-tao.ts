import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getKhoaDaoTaos,
  createKhoaDaoTao,
  updateKhoaDaoTao,
  updateKhoaDaoTaoPhanQuyen,
  deleteKhoaDaoTaos,
} from '../services/khoa-dao-tao-service';
import type { KhoaDaoTaoFormValues } from '../core/schema';

const QUERY_KEY = ['khoaDaoTao'];

export const useKhoaDaoTaos = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getKhoaDaoTaos,
    staleTime: 1000 * 60 * 3,
  });
};

export const useCreateKhoaDaoTao = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KhoaDaoTaoFormValues) => createKhoaDaoTao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('khoaDaoTao.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateKhoaDaoTao = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KhoaDaoTaoFormValues> }) =>
      updateKhoaDaoTao(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('khoaDaoTao.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateKhoaDaoTaoPhanQuyen = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, id_chuc_vu_xem }: { id: string; id_chuc_vu_xem: string[] }) =>
      updateKhoaDaoTaoPhanQuyen(id, id_chuc_vu_xem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('khoaDaoTao.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteKhoaDaoTaos = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteKhoaDaoTaos(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('khoaDaoTao.toast.deleteSuccess', { count: ids.length }));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
