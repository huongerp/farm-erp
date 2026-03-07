import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getNhomHanhDongList,
  getNhomHanhDongById,
  createNhomHanhDong,
  updateNhomHanhDong,
  deleteNhomHanhDong,
} from '../services/nhom-hanh-dong-service';
import type { ThietLapNhomHanhDongFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['nhomHanhDong'] as const;

export function useNhomHanhDongList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getNhomHanhDongList,
    staleTime: 1000 * 60 * 2,
  });
}

export function useNhomHanhDongById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getNhomHanhDongById(id!),
    enabled: !!id,
  });
}

export function useCreateNhomHanhDong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ThietLapNhomHanhDongFormValues) =>
      createNhomHanhDong(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hanhDongCotLoi.thietLap.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateNhomHanhDong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThietLapNhomHanhDongFormValues> }) =>
      updateNhomHanhDong(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hanhDongCotLoi.thietLap.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteNhomHanhDong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNhomHanhDong,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hanhDongCotLoi.thietLap.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
