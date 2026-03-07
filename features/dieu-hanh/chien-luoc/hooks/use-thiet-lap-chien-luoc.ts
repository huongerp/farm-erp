import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getLoaiChienLuocList,
  updateLoaiChienLuoc,
  createLoaiChienLuoc,
  deleteLoaiChienLuoc,
  type CreateLoaiChienLuocPayload,
} from '../services/thiet-lap-chien-luoc-service';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['chienLuoc', 'thietLap'] as const;

export function useLoaiChienLuocList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getLoaiChienLuocList,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateLoaiChienLuoc(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { ten?: string; mo_ta?: string | null; cau_chien_luoc_mau?: string | null; thu_tu?: number };
    }) => updateLoaiChienLuoc(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['chienLuoc'] });
      toast.success(i18n.t('chienLuoc.thietLap.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateLoaiChienLuoc(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLoaiChienLuocPayload) => createLoaiChienLuoc(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['chienLuoc'] });
      toast.success(i18n.t('chienLuoc.thietLap.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLoaiChienLuoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLoaiChienLuoc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['chienLuoc'] });
      toast.success(i18n.t('chienLuoc.thietLap.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
