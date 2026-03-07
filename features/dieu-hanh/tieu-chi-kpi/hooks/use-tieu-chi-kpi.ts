import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTieuChiList,
  getTieuChiByHanhDongId,
  getTieuChiById,
  createTieuChiKpi,
  updateTieuChiKpi,
  deleteTieuChiKpi,
  rebalanceTyTrongForHanhDong,
  type TieuChiListParams,
} from '../services/tieu-chi-kpi-service';
import type { TieuChiKpi } from '../core/types';
import type { TieuChiKpiFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['tieuChiKpi'] as const;

export function useTieuChiList(params?: TieuChiListParams) {
  return useQuery({
    queryKey: [
      ...QUERY_KEY,
      'list',
      params?.id_hanh_dong,
      params?.loai,
      params?.cach_tinh_diem,
      params?.tan_suat,
    ],
    queryFn: () => getTieuChiList(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTieuChiByHanhDongId(id_hanh_dong: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'byHanhDong', id_hanh_dong],
    queryFn: () => getTieuChiByHanhDongId(id_hanh_dong!),
    enabled: !!id_hanh_dong,
    staleTime: 1000 * 60 * 2,
  });
}

export function useTieuChiById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => getTieuChiById(id!),
    enabled: !!id,
  });
}

export function useCreateTieuChiKpi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTieuChiKpi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('tieuChiKpi.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTieuChiKpi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TieuChiKpiFormValues> }) =>
      updateTieuChiKpi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('tieuChiKpi.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTieuChiKpi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTieuChiKpi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('tieuChiKpi.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRebalanceTyTrongKpi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id_hanh_dong,
      mode,
    }: {
      id_hanh_dong: string;
      mode: 'equal' | 'proportional';
    }) => rebalanceTyTrongForHanhDong(id_hanh_dong, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('tieuChiKpi.toast.rebalanceSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
