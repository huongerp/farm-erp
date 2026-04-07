import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import {
  getAllThuHoach,
  getThuHoachById,
  createThuHoach,
  updateThuHoachKeHoach,
  updateThuHoachThucTe,
  deleteThuHoach,
  deleteThuHoachMany,
} from '../services/thu-hoach-service';
import type { ThuHoachKeHoachFormValues, ThuHoachThucTeFormValues } from '../core/schema';

export const QUERY_KEY_THU_HOACH = ['thuHoach'] as const;

export function useThuHoachList() {
  return useQuery({
    queryKey: QUERY_KEY_THU_HOACH,
    queryFn: getAllThuHoach,
    staleTime: 1000 * 60 * 2,
  });
}

export function useThuHoachById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_THU_HOACH, id],
    queryFn: () => getThuHoachById(id!),
    enabled: !!id,
  });
}

export function useCreateThuHoach(onSuccess?: () => void) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: ThuHoachKeHoachFormValues) => createThuHoach(data, user?.id ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THU_HOACH });
      toast.success(i18n.t('thuHoach.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateThuHoachKeHoach(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThuHoachKeHoachFormValues }) =>
      updateThuHoachKeHoach(id, data),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THU_HOACH });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_THU_HOACH, id] });
      toast.success(i18n.t('thuHoach.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateThuHoachThucTe(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThuHoachThucTeFormValues }) =>
      updateThuHoachThucTe(id, data),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THU_HOACH });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_THU_HOACH, id] });
      toast.success(i18n.t('thuHoach.toast.thucTeSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteThuHoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteThuHoach,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THU_HOACH });
      toast.success(i18n.t('thuHoach.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteThuHoachMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteThuHoachMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THU_HOACH });
      toast.success(i18n.t('thuHoach.toast.deleteManySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
