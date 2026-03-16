import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getTienDoMuaHangList,
  createTienDoMuaHang,
  updateTienDoMuaHang,
  deleteTienDoMuaHangList,
  updateTienDoMuaHangStatus,
} from '../services/tien-do-mua-hang-service';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import type { TienDoMuaHangFormValues } from '../core/schema';

export const TIEN_DO_MUA_HANG_QUERY_KEY = ['tienDoMuaHang'];

export const useTienDoMuaHangList = () =>
  useQuery({
    queryKey: TIEN_DO_MUA_HANG_QUERY_KEY,
    queryFn: getTienDoMuaHangList,
  });

export const useCreateTienDoMuaHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TienDoMuaHangFormValues) => createTienDoMuaHang(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.tienDoMuaHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTienDoMuaHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TienDoMuaHangFormValues }) => updateTienDoMuaHang(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.tienDoMuaHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTienDoMuaHangStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThaiHoatDong }) => updateTienDoMuaHangStatus(ids, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.tienDoMuaHang.toast.statusUpdate', { count: v.ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteTienDoMuaHangList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTienDoMuaHangList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.tienDoMuaHang.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
