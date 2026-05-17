import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getAllHopDongSupabase,
  getHopDongByIdSupabase,
  createHopDongSupabase,
  updateHopDongSupabase,
  updateHopDongTrangThaiSupabase,
  insertHopDongChiTietSupabase,
  updateHopDongChiTietSupabase,
  deleteHopDongChiTietSupabase,
  deleteHopDongSupabase,
  deleteHopDongManySupabase,
  getAllHopDongChiTietEnrichedSupabase,
} from '../services/hop-dong-supabase.service';
import type { HopDongFormValues, HopDongChiTietLineValues } from '../core/schema';
import type { TrangThaiHopDong } from '../core/constants';

export const HOP_DONG_QUERY_KEY = ['hopDong'] as const;
export const HOP_DONG_CHI_TIET_ALL_KEY = [...HOP_DONG_QUERY_KEY, 'chiTietAll'] as const;

function invalidateHopDongQueries(queryClient: ReturnType<typeof useQueryClient>, idHopDong?: string) {
  queryClient.invalidateQueries({ queryKey: HOP_DONG_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: HOP_DONG_CHI_TIET_ALL_KEY });
  if (idHopDong) {
    queryClient.invalidateQueries({ queryKey: [...HOP_DONG_QUERY_KEY, 'detail', idHopDong] });
  }
}

export function useHopDongList() {
  return useQuery({
    queryKey: HOP_DONG_QUERY_KEY,
    queryFn: getAllHopDongSupabase,
  });
}

export function useHopDongById(id: string | undefined) {
  return useQuery({
    queryKey: [...HOP_DONG_QUERY_KEY, 'detail', id],
    queryFn: () => getHopDongByIdSupabase(id!),
    enabled: !!id,
  });
}

export function useHopDongChiTietAllList() {
  return useQuery({
    queryKey: HOP_DONG_CHI_TIET_ALL_KEY,
    queryFn: getAllHopDongChiTietEnrichedSupabase,
  });
}

export function useCreateHopDong(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, idNguoiTao }: { data: HopDongFormValues; idNguoiTao: string }) =>
      createHopDongSupabase(data, idNguoiTao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOP_DONG_QUERY_KEY });
      toast.success(i18n.t('hopDong.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateHopDong(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HopDongFormValues }) => updateHopDongSupabase(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: HOP_DONG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...HOP_DONG_QUERY_KEY, 'detail', id] });
      toast.success(i18n.t('hopDong.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteHopDong() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHopDongSupabase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOP_DONG_QUERY_KEY });
      toast.success(i18n.t('hopDong.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteHopDongMany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteHopDongManySupabase(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOP_DONG_QUERY_KEY });
      toast.success(i18n.t('hopDong.toast.deleteManySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateHopDongTrangThai(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      trang_thai,
      ghi_chu,
    }: {
      id: string;
      trang_thai: TrangThaiHopDong;
      ghi_chu: string | null;
    }) => updateHopDongTrangThaiSupabase(id, trang_thai, ghi_chu),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: HOP_DONG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...HOP_DONG_QUERY_KEY, 'detail', id] });
      toast.success(i18n.t('hopDong.toast.updateStatusSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useInsertHopDongChiTiet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idHopDong,
      row,
      idNguoiTao,
    }: {
      idHopDong: string;
      row: HopDongChiTietLineValues;
      idNguoiTao: string | null;
    }) => insertHopDongChiTietSupabase(idHopDong, row, idNguoiTao),
    onSuccess: (_, { idHopDong }) => {
      invalidateHopDongQueries(queryClient, idHopDong);
      toast.success(i18n.t('hopDong.toast.chiTietCreateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateHopDongChiTiet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idCt,
      row,
    }: {
      idCt: string;
      idHopDong: string;
      row: HopDongChiTietLineValues;
    }) => updateHopDongChiTietSupabase(idCt, row),
    onSuccess: (_, { idHopDong }) => {
      invalidateHopDongQueries(queryClient, idHopDong);
      toast.success(i18n.t('hopDong.toast.chiTietUpdateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteHopDongChiTiet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idCt, idHopDong }: { idCt: string; idHopDong: string }) =>
      deleteHopDongChiTietSupabase(idCt).then(() => idHopDong),
    onSuccess: (idHopDong) => {
      invalidateHopDongQueries(queryClient, idHopDong);
      toast.success(i18n.t('hopDong.toast.chiTietDeleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
