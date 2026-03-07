import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDonViTinhList,
  getDonViTinhById,
  createDonViTinh,
  updateDonViTinh,
  deleteDonViTinh,
} from '../services/don-vi-tinh-service';
import type { ThietLapDonViTinhFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['donViTinh'] as const;

export function useDonViTinhList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getDonViTinhList,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDonViTinhById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getDonViTinhById(id!),
    enabled: !!id,
  });
}

export function useCreateDonViTinh(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ThietLapDonViTinhFormValues) => createDonViTinh(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['tieuChiKpi'] });
      toast.success(i18n.t('tieuChiKpi.thietLapDvt.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDonViTinh(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThietLapDonViTinhFormValues> }) =>
      updateDonViTinh(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['tieuChiKpi'] });
      toast.success(i18n.t('tieuChiKpi.thietLapDvt.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDonViTinh(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDonViTinh,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['tieuChiKpi'] });
      toast.success(i18n.t('tieuChiKpi.thietLapDvt.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
