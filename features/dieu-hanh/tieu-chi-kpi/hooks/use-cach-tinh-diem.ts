import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCachTinhDiemList,
  getCachTinhDiemById,
  createCachTinhDiem,
  updateCachTinhDiem,
  deleteCachTinhDiem,
} from '../services/cach-tinh-diem-service';
import type { ThietLapCachTinhDiemFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['cachTinhDiem'] as const;

export function useCachTinhDiemList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCachTinhDiemList,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCachTinhDiemById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getCachTinhDiemById(id!),
    enabled: !!id,
  });
}

export function useCreateCachTinhDiem(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ThietLapCachTinhDiemFormValues) => createCachTinhDiem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['tieuChiKpi'] });
      toast.success(i18n.t('tieuChiKpi.thietLapCtd.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCachTinhDiem(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThietLapCachTinhDiemFormValues> }) =>
      updateCachTinhDiem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['tieuChiKpi'] });
      toast.success(i18n.t('tieuChiKpi.thietLapCtd.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCachTinhDiem(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCachTinhDiem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['tieuChiKpi'] });
      toast.success(i18n.t('tieuChiKpi.thietLapCtd.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
