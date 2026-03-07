import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getHanhDongList,
  getHanhDongByChienLuocId,
  getHanhDongById,
  createHanhDongCotLoi,
  updateHanhDongCotLoi,
  deleteHanhDongCotLoi,
  rebalanceTyTrongForChienLuoc,
  type HanhDongListParams,
} from '../services/hanh-dong-cot-loi-service';
import { getChienLuocList } from '../../chien-luoc/services/chien-luoc-service';
import type { HanhDongCotLoi } from '../core/types';
import type { HanhDongCotLoiFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['hanhDongCotLoi'] as const;

export function useChienLuocDaDuyet(nam?: number | null) {
  return useQuery({
    queryKey: ['chienLuocDaDuyet', nam],
    queryFn: async () => {
      const list = await getChienLuocList(nam != null ? { nam } : undefined);
      return list.filter((c) => c.trang_thai_duyet === 'da_duyet');
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useHanhDongList(
  params?: HanhDongListParams,
  chienLuocMap?: Map<string, { nam: number }>
) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'list', params?.id_chien_luoc, params?.nam, params?.bsc_dimension, params?.nhom_hanh_dong],
    queryFn: () => getHanhDongList(params, chienLuocMap),
    staleTime: 1000 * 60 * 2,
  });
}

export function useHanhDongByChienLuocId(id_chien_luoc: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'byChienLuoc', id_chien_luoc],
    queryFn: () => getHanhDongByChienLuocId(id_chien_luoc!),
    enabled: !!id_chien_luoc,
    staleTime: 1000 * 60 * 2,
  });
}

export function useHanhDongById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => getHanhDongById(id!),
    enabled: !!id,
  });
}

export function useCreateHanhDongCotLoi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHanhDongCotLoi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hanhDongCotLoi.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateHanhDongCotLoi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HanhDongCotLoiFormValues> }) =>
      updateHanhDongCotLoi(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hanhDongCotLoi.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteHanhDongCotLoi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHanhDongCotLoi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hanhDongCotLoi.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRebalanceTyTrong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id_chien_luoc, mode }: { id_chien_luoc: string; mode: 'equal' | 'proportional' }) =>
      rebalanceTyTrongForChienLuoc(id_chien_luoc, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hanhDongCotLoi.toast.rebalanceSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
