import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import type { BaoCaoSoCheListServerQuery } from '../services/bao-cao-so-che-list-query';
import {
  getAllBaoCaoSoChe,
  getBaoCaoSoChePage,
  getBaoCaoSoCheTomTat,
  getBaoCaoSoCheById,
  createBaoCaoSoChe,
  updateBaoCaoSoChe,
  deleteBaoCaoSoChe,
  deleteBaoCaoSoCheMany,
  updateBaoCaoSoCheTrangThai,
  updateBaoCaoSoCheTrangThaiMany,
} from '../services/bao-cao-so-che-service';
import {
  findBaoCaoSoCheDuplicateByBranchAndDate,
  farmBaoCaoSoCheToFormNextDay,
  type PhieuTomTatTrung,
} from '../core/form-mappers';
import type { BaoCaoSoCheFormValues } from '../core/schema';
import type { FarmBaoCaoSoChe, TrangThaiBaoCaoSoChePhieu } from '../core/types';

export const QUERY_KEY_BAO_CAO_SO_CHE = ['baoCaoSoChe'] as const;

/** Một trang danh sách — lọc / sắp xếp / phân trang chạy ở PostgREST. */
export function useBaoCaoSoChePage(query: BaoCaoSoCheListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_SO_CHE, 'page', query],
    queryFn: () => getBaoCaoSoChePage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

/** Danh sách tóm tắt: chip lọc + số đếm, gợi ý chi nhánh, chặn trùng ngày. */
export function useBaoCaoSoCheTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_SO_CHE, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getBaoCaoSoCheTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

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
      /** Danh sách tóm tắt (id / ngày / chi nhánh) — đủ để biết ngày kế đã có phiếu chưa. */
      existingList: PhieuTomTatTrung[];
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

/** Khóa / mở khóa hàng loạt — một UPDATE ... IN, không có trạng thái dở dang từng phiếu. */
export function useUpdateBaoCaoSoCheTrangThaiMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, trang_thai }: { ids: string[]; trang_thai: TrangThaiBaoCaoSoChePhieu }) =>
      updateBaoCaoSoCheTrangThaiMany(ids, trang_thai),
    onSuccess: (_void, { ids }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_SO_CHE });
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY_BAO_CAO_SO_CHE, id] }));
      toast.success(i18n.t('baoCaoSoChe.toast.trangThaiUpdatedMany', { count: ids.length }));
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
