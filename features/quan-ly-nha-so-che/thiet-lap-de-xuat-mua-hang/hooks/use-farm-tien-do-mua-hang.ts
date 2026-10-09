import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getFarmTienDoMuaHangList,
  createFarmTienDoMuaHang,
  updateFarmTienDoMuaHang,
  deleteFarmTienDoMuaHangList,
  updateFarmTienDoMuaHangStatus,
} from '../services/farm-tien-do-mua-hang-service';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import type { FarmTienDoMuaHangFormValues } from '../core/schema';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';

export const FARM_TIEN_DO_MUA_HANG_QUERY_KEY = ['farmTienDoMuaHang'];

export const useFarmTienDoMuaHangList = () => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...FARM_TIEN_DO_MUA_HANG_QUERY_KEY, bt.key],
    queryFn: () => getFarmTienDoMuaHangList(bt),
  });
};

export const useCreateFarmTienDoMuaHang = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FarmTienDoMuaHangFormValues) => createFarmTienDoMuaHang(bt, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FARM_TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateFarmTienDoMuaHang = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FarmTienDoMuaHangFormValues }) => updateFarmTienDoMuaHang(bt, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FARM_TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateFarmTienDoMuaHangStatus = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThaiHoatDong }) => updateFarmTienDoMuaHangStatus(bt, ids, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: FARM_TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.toast.statusUpdate', { count: v.ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteFarmTienDoMuaHangList = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteFarmTienDoMuaHangList(bt, ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: FARM_TIEN_DO_MUA_HANG_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatMuaHang.tienDoMuaHang.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
