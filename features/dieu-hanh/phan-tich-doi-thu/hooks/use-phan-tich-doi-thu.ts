import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDanhSachDoiThu,
  getDoiThuById,
  createDoiThu,
  updateDoiThu,
  deleteDoiThu,
  getTaiLieu,
  getAllTaiLieu,
  themTaiLieu,
  capNhatTaiLieu,
  xoaTaiLieu,
  getNhatKy,
  getAllNhatKy,
  themNhatKy,
  capNhatNhatKy,
  xoaNhatKy,
  getBattlecard,
  updateBattlecard,
} from '../services/phan-tich-doi-thu-service';
import type { DoiThuFormValues, BattlecardFormValues } from '../core/schema';
import type { DoiThuTaiLieu } from '../core/types';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['phanTichDoiThu'] as const;

export function useDoiThuList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getDanhSachDoiThu,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDoiThuById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => getDoiThuById(id!),
    enabled: !!id,
  });
}

export function useCreateDoiThu(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDoiThu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phanTichDoiThu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDoiThu(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DoiThuFormValues }) => updateDoiThu(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', id] });
      toast.success(i18n.t('phanTichDoiThu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDoiThu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDoiThu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phanTichDoiThu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTaiLieu(doiThuId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'taiLieu', doiThuId],
    queryFn: () => getTaiLieu(doiThuId!),
    enabled: !!doiThuId,
  });
}

export function useThemTaiLieu(doiThuId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ten_file: string; duong_dan_file?: string; loai: DoiThuTaiLieu['loai'] }) =>
      themTaiLieu(doiThuId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'taiLieu', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allTaiLieu'] });
      toast.success(i18n.t('phanTichDoiThu.toast.uploadSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCapNhatTaiLieu(doiThuId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { ten_file?: string; duong_dan_file?: string; loai?: DoiThuTaiLieu['loai'] } }) =>
      capNhatTaiLieu(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'taiLieu', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allTaiLieu'] });
      toast.success(i18n.t('phanTichDoiThu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useXoaTaiLieu(doiThuId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: xoaTaiLieu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'taiLieu', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allTaiLieu'] });
      toast.success(i18n.t('phanTichDoiThu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Thêm tài liệu từ màn tổng hợp (truyền doiThuId trong payload) */
export function useThemTaiLieuAny(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doiThuId, payload }: { doiThuId: string; payload: { ten_file: string; duong_dan_file?: string; loai: DoiThuTaiLieu['loai'] } }) =>
      themTaiLieu(doiThuId, payload),
    onSuccess: (_, { doiThuId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'taiLieu', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allTaiLieu'] });
      toast.success(i18n.t('phanTichDoiThu.toast.uploadSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Cập nhật tài liệu từ màn tổng hợp (truyền doiThuId để invalidate) */
export function useCapNhatTaiLieuAny(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, doiThuId }: { id: string; data: { ten_file?: string; duong_dan_file?: string; loai?: DoiThuTaiLieu['loai'] }; doiThuId: string }) =>
      capNhatTaiLieu(id, data),
    onSuccess: (_, { doiThuId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'taiLieu', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allTaiLieu'] });
      toast.success(i18n.t('phanTichDoiThu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Xóa tài liệu từ màn tổng hợp (truyền doiThuId để invalidate) */
export function useXoaTaiLieuAny() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, doiThuId }: { id: string; doiThuId: string }) => xoaTaiLieu(id),
    onSuccess: (_, { doiThuId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'taiLieu', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allTaiLieu'] });
      toast.success(i18n.t('phanTichDoiThu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Thêm nhật ký từ màn tổng hợp (truyền doiThuId trong payload) */
export function useThemNhatKyAny(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doiThuId, payload }: { doiThuId: string; payload: { noi_dung: string; nguoi_tao: string; ngay?: string } }) =>
      themNhatKy(doiThuId, payload),
    onSuccess: (_, { doiThuId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'nhatKy', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allNhatKy'] });
      toast.success(i18n.t('phanTichDoiThu.toast.logAdded'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Cập nhật nhật ký từ màn tổng hợp */
export function useCapNhatNhatKyAny(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, doiThuId }: { id: string; data: { noi_dung?: string; nguoi_tao?: string; ngay?: string }; doiThuId: string }) =>
      capNhatNhatKy(id, data),
    onSuccess: (_, { doiThuId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'nhatKy', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allNhatKy'] });
      toast.success(i18n.t('phanTichDoiThu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Xóa nhật ký từ màn tổng hợp */
export function useXoaNhatKyAny() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, doiThuId }: { id: string; doiThuId: string }) => xoaNhatKy(id),
    onSuccess: (_, { doiThuId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'nhatKy', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allNhatKy'] });
      toast.success(i18n.t('phanTichDoiThu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useNhatKy(doiThuId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'nhatKy', doiThuId],
    queryFn: () => getNhatKy(doiThuId!),
    enabled: !!doiThuId,
  });
}

export function useAllTaiLieu() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'allTaiLieu'],
    queryFn: getAllTaiLieu,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAllNhatKy() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'allNhatKy'],
    queryFn: getAllNhatKy,
    staleTime: 1000 * 60 * 2,
  });
}

export function useThemNhatKy(doiThuId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { noi_dung: string; nguoi_tao: string; ngay?: string }) => themNhatKy(doiThuId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'nhatKy', doiThuId] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'allNhatKy'] });
      toast.success(i18n.t('phanTichDoiThu.toast.logAdded'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBattlecard(doiThuId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'battlecard', doiThuId],
    queryFn: () => getBattlecard(doiThuId!),
    enabled: !!doiThuId,
  });
}

export function useUpdateBattlecard(doiThuId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BattlecardFormValues) => updateBattlecard(doiThuId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'battlecard', doiThuId] });
      toast.success(i18n.t('phanTichDoiThu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
