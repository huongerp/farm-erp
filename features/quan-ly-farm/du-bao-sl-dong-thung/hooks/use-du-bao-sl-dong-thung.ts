import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import type { DuBaoSlDongThungListServerQuery } from '../services/du-bao-sl-dong-thung-list-query';
import {
  getAllDuBaoSlDongThung,
  getDuBaoSlDongThungPage,
  getDuBaoSlDongThungTomTat,
  getDuBaoSlDongThungById,
  createDuBaoSlDongThung,
  updateDuBaoSlDongThung,
  deleteDuBaoSlDongThung,
  deleteDuBaoSlDongThungMany,
  updateDuBaoSlDongThungTrangThai,
  updateDuBaoSlDongThungTrangThaiMany,
} from '../services/du-bao-sl-dong-thung-service';
import type { DuBaoSlDongThungFormValues } from '../core/schema';
import type { TrangThaiDuBaoSlDongThungPhieu } from '../core/types';

export const QUERY_KEY_DU_BAO_SL_DONG_THUNG = ['duBaoSlDongThung'] as const;

/** Một trang danh sách — lọc / sắp xếp / phân trang chạy ở PostgREST. */
export function useDuBaoSlDongThungPage(query: DuBaoSlDongThungListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DU_BAO_SL_DONG_THUNG, 'page', query],
    queryFn: () => getDuBaoSlDongThungPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

/** Danh sách tóm tắt: chip lọc + số đếm, gợi ý chi nhánh, chặn trùng ngày. */
export function useDuBaoSlDongThungTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DU_BAO_SL_DONG_THUNG, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getDuBaoSlDongThungTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDuBaoSlDongThungList() {
  return useQuery({
    queryKey: QUERY_KEY_DU_BAO_SL_DONG_THUNG,
    queryFn: getAllDuBaoSlDongThung,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDuBaoSlDongThungById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_DU_BAO_SL_DONG_THUNG, id],
    queryFn: () => getDuBaoSlDongThungById(id!),
    enabled: !!id,
  });
}

export function useCreateDuBaoSlDongThung(onSuccess?: () => void) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: DuBaoSlDongThungFormValues) => createDuBaoSlDongThung(data, user?.id ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DU_BAO_SL_DONG_THUNG });
      toast.success(i18n.t('duBaoSlDongThung.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDuBaoSlDongThung(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DuBaoSlDongThungFormValues }) => updateDuBaoSlDongThung(id, data),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DU_BAO_SL_DONG_THUNG });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_DU_BAO_SL_DONG_THUNG, id] });
      toast.success(i18n.t('duBaoSlDongThung.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDuBaoSlDongThung() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDuBaoSlDongThung,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DU_BAO_SL_DONG_THUNG });
      toast.success(i18n.t('duBaoSlDongThung.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDuBaoSlDongThungMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDuBaoSlDongThungMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DU_BAO_SL_DONG_THUNG });
      toast.success(i18n.t('duBaoSlDongThung.toast.deleteManySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Khóa / mở khóa hàng loạt — một UPDATE ... IN, không có trạng thái dở dang từng phiếu. */
export function useUpdateDuBaoSlDongThungTrangThaiMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, trang_thai }: { ids: string[]; trang_thai: TrangThaiDuBaoSlDongThungPhieu }) =>
      updateDuBaoSlDongThungTrangThaiMany(ids, trang_thai),
    onSuccess: (_void, { ids }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DU_BAO_SL_DONG_THUNG });
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY_DU_BAO_SL_DONG_THUNG, id] }));
      toast.success(i18n.t('duBaoSlDongThung.toast.trangThaiUpdatedMany', { count: ids.length }));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDuBaoSlDongThungTrangThai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiDuBaoSlDongThungPhieu }) =>
      updateDuBaoSlDongThungTrangThai(id, trang_thai),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DU_BAO_SL_DONG_THUNG });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_DU_BAO_SL_DONG_THUNG, id] });
      toast.success(i18n.t('duBaoSlDongThung.toast.trangThaiUpdated'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
