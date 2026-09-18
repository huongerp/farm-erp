import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ThuHoachListServerQuery } from '../services/thu-hoach-list-query';
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
  appendThuHoachTraoDoi,
  getThuHoachPage,
  getThuHoachTomTat,
} from '../services/thu-hoach-service';
import type { ThuHoachKeHoachFormValues, ThuHoachThucTeFormValues } from '../core/schema';

export const QUERY_KEY_THU_HOACH = ['thuHoach'] as const;

/** Một trang danh sách — lọc / sắp xếp / phân trang chạy ở PostgREST. */
export function useThuHoachPage(query: ThuHoachListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_THU_HOACH, 'page', query],
    queryFn: () => getThuHoachPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

/** Tóm tắt toàn bộ phiếu: chip lọc + gợi ý chi nhánh. */
export function useThuHoachTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_THU_HOACH, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getThuHoachTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

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

export function useAppendThuHoachTraoDoi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      noiDung,
      tenNguoiGhi,
    }: {
      id: string;
      noiDung: string;
      tenNguoiGhi: string;
    }) => appendThuHoachTraoDoi(id, noiDung, tenNguoiGhi),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THU_HOACH });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_THU_HOACH, id] });
      toast.success(i18n.t('thuHoach.toast.traoDoiSuccess'));
      onSuccess?.();
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
