import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import {
  getAllBaoCaoSoChe,
  getBaoCaoSoCheById,
  createBaoCaoSoChe,
  updateBaoCaoSoChe,
  deleteBaoCaoSoChe,
  deleteBaoCaoSoCheMany,
  updateBaoCaoSoCheTrangThai,
} from '../services/bao-cao-so-che-service';
import { findBaoCaoSoCheDuplicateByBranchAndDate, farmBaoCaoSoCheToFormNextDay } from '../core/form-mappers';
import type { BaoCaoSoCheFormValues } from '../core/schema';
import type { FarmBaoCaoSoChe, TrangThaiBaoCaoSoChePhieu } from '../core/types';

export const QUERY_KEY_BAO_CAO_SO_CHE = ['baoCaoSoChe'] as const;

export function useBaoCaoSoCheList() {
  return useQuery({
    queryKey: QUERY_KEY_BAO_CAO_SO_CHE,
    queryFn: getAllBaoCaoSoChe,
    staleTime: 1000 * 60 * 2,
  });
}

export function useBaoCaoSoCheById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_SO_CHE, id],
    queryFn: () => getBaoCaoSoCheById(id!),
    enabled: !!id,
  });
}

export function useCreateBaoCaoSoChe(onSuccess?: () => void) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: BaoCaoSoCheFormValues) => createBaoCaoSoChe(data, user?.id ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      toast.success(i18n.t('baoCaoSoChe.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCopyBaoCaoSoCheToNextDay() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({
      source,
      existingList,
    }: {
      source: FarmBaoCaoSoChe;
      existingList: FarmBaoCaoSoChe[];
    }) => {
      const values = farmBaoCaoSoCheToFormNextDay(source);
      const dup = findBaoCaoSoCheDuplicateByBranchAndDate(existingList, values.ngay, values.id_chi_nhanh, null);
      if (dup) {
        throw new Error(i18n.t('baoCaoSoChe.validation.duplicateNgayChiNhanh'));
      }
      return createBaoCaoSoChe(values, user?.id ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      toast.success(i18n.t('baoCaoSoChe.toast.copyNextDaySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBaoCaoSoChe(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BaoCaoSoCheFormValues }) => updateBaoCaoSoChe(id, data),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_BAO_CAO_SO_CHE, id] });
      toast.success(i18n.t('baoCaoSoChe.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBaoCaoSoChe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaoCaoSoChe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      toast.success(i18n.t('baoCaoSoChe.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBaoCaoSoCheMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaoCaoSoCheMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      toast.success(i18n.t('baoCaoSoChe.toast.deleteManySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBaoCaoSoCheTrangThai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiBaoCaoSoChePhieu }) =>
      updateBaoCaoSoCheTrangThai(id, trang_thai),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_BAO_CAO_SO_CHE, id] });
      toast.success(i18n.t('baoCaoSoChe.toast.trangThaiUpdated'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
