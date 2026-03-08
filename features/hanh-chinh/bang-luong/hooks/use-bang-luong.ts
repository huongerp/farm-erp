import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getBangLuongRecords,
  getBangLuongById,
  addBangLuong,
  saveBangLuong,
  deleteBangLuong,
  createBangLuongFromRecord,
} from '../services/bang-luong-service';
import type { BangLuongRecord } from '../core/types';

export const BANG_LUONG_KEYS = {
  all: ['bangLuong'] as const,
  list: () => [...BANG_LUONG_KEYS.all, 'list'] as const,
  detail: (id: string) => [...BANG_LUONG_KEYS.all, 'detail', id] as const,
};

export function useBangLuongRecords() {
  return useQuery({
    queryKey: BANG_LUONG_KEYS.list(),
    queryFn: getBangLuongRecords,
  });
}

export function useBangLuongById(id: string | null) {
  return useQuery({
    queryKey: BANG_LUONG_KEYS.detail(id ?? ''),
    queryFn: () => getBangLuongById(id!),
    enabled: !!id,
  });
}

export function useAddBangLuong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id_nhan_vien, nam, thang }: { id_nhan_vien: string; nam: number; thang: number }) =>
      addBangLuong(id_nhan_vien, nam, thang),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANG_LUONG_KEYS.all });
      toast.success(i18n.t('bangLuong.toast.addSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useCreateBangLuongFromRecord(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBangLuongFromRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANG_LUONG_KEYS.all });
      toast.success(i18n.t('bangLuong.toast.addSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useSaveBangLuong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record: BangLuongRecord) => saveBangLuong(record),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANG_LUONG_KEYS.all });
      toast.success(i18n.t('bangLuong.toast.saveSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteBangLuong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteBangLuong(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANG_LUONG_KEYS.all });
      toast.success(i18n.t('bangLuong.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}
