import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import {
  getAllBaoCaoNhanCong,
  getBaoCaoNhanCongById,
  createBaoCaoNhanCong,
  updateBaoCaoNhanCong,
  deleteBaoCaoNhanCong,
  deleteBaoCaoNhanCongMany,
  updateBaoCaoNhanCongTrangThai,
} from '../services/bao-cao-nhan-cong-service';
import { findBaoCaoDuplicateByBranchAndDate, farmBaoCaoNhanCongToFormNextDay } from '../core/form-mappers';
import type { BaoCaoNhanCongFormValues } from '../core/schema';
import type { FarmBaoCaoNhanCong, TrangThaiBaoCaoNhanCongPhieu } from '../core/types';

export const QUERY_KEY_BAO_CAO_NHAN_CONG = ['baoCaoNhanCong'] as const;

export function useBaoCaoNhanCongList() {
  return useQuery({
    queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG,
    queryFn: getAllBaoCaoNhanCong,
    staleTime: 1000 * 60 * 2,
  });
}

export function useBaoCaoNhanCongById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, id],
    queryFn: () => getBaoCaoNhanCongById(id!),
    enabled: !!id,
  });
}

export function useCreateBaoCaoNhanCong(onSuccess?: () => void) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: BaoCaoNhanCongFormValues) => createBaoCaoNhanCong(data, user?.id ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Tạo phiếu mới cho ngày kế tiếp (cùng chi nhánh + copy số liệu / ghi chú). */
export function useCopyBaoCaoNhanCongToNextDay() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({
      source,
      existingList,
    }: {
      source: FarmBaoCaoNhanCong;
      existingList: FarmBaoCaoNhanCong[];
    }) => {
      const values = farmBaoCaoNhanCongToFormNextDay(source);
      const dup = findBaoCaoDuplicateByBranchAndDate(
        existingList,
        values.ngay,
        values.id_chi_nhanh,
        null
      );
      if (dup) {
        throw new Error(i18n.t('baoCaoNhanCong.validation.duplicateNgayChiNhanh'));
      }
      return createBaoCaoNhanCong(values, user?.id ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.copyNextDaySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBaoCaoNhanCong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BaoCaoNhanCongFormValues }) =>
      updateBaoCaoNhanCong(id, data),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, id] });
      toast.success(i18n.t('baoCaoNhanCong.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBaoCaoNhanCong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaoCaoNhanCong,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBaoCaoNhanCongMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaoCaoNhanCongMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.deleteManySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBaoCaoNhanCongTrangThai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiBaoCaoNhanCongPhieu }) =>
      updateBaoCaoNhanCongTrangThai(id, trang_thai),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, id] });
      toast.success(i18n.t('baoCaoNhanCong.toast.trangThaiUpdated'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
