import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getChienLuocList,
  getChienLuocById,
  createChienLuoc,
  updateChienLuoc,
  deleteChienLuoc,
  getSwotByYear,
  type ChienLuocListParams,
} from '../services/chien-luoc-service';
import type { ChienLuocFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['chienLuoc'] as const;

export function useChienLuocList(params?: ChienLuocListParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params?.nam],
    queryFn: () => getChienLuocList(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useChienLuocById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => getChienLuocById(id!),
    enabled: !!id,
  });
}

export function useCreateChienLuoc(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createChienLuoc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('chienLuoc.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateChienLuoc(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChienLuocFormValues> }) =>
      updateChienLuoc(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', id] });
      toast.success(i18n.t('chienLuoc.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteChienLuoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteChienLuoc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('chienLuoc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Lấy bản SWOT theo năm (để chọn yếu tố S/W/O/T khi tạo/sửa chiến lược) */
export function useSwotByYear(nam: number | null) {
  return useQuery({
    queryKey: ['swotByYear', nam],
    queryFn: () => getSwotByYear(nam!),
    enabled: nam != null && nam >= 2000 && nam <= 2100,
    staleTime: 1000 * 60 * 2,
  });
}
