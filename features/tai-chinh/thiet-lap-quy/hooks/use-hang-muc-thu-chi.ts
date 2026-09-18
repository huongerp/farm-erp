import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import type { HangMucThuChiFormValues } from '../core/schema';
import {
  getHangMucThuChiList,
  createHangMucThuChi,
  updateHangMucThuChi,
  updateHangMucThuChiStatus,
  deleteHangMucThuChiList,
} from '../services/hang-muc-thu-chi-service';

export const HANG_MUC_THU_CHI_QUERY_KEY = ['hangMucThuChi'];

/** Danh mục nhỏ, đổi rất ít → cache dài như các bảng tham chiếu khác (useBranches). */
const REF_STALE_TIME = 1000 * 60 * 60 * 4;

export const useHangMucThuChiList = () =>
  useQuery({
    queryKey: HANG_MUC_THU_CHI_QUERY_KEY,
    queryFn: getHangMucThuChiList,
    staleTime: REF_STALE_TIME,
    gcTime: 1000 * 60 * 60 * 24,
  });

/** Alias ngữ nghĩa cho các module chỉ đọc danh mục (Thu chi quỹ, Thống kê quỹ). */
export const useHangMucThuChiRef = useHangMucThuChiList;

export const useCreateHangMucThuChi = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HangMucThuChiFormValues) => createHangMucThuChi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANG_MUC_THU_CHI_QUERY_KEY });
      toast.success(i18n.t('thietLapQuy.hangMuc.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateHangMucThuChi = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HangMucThuChiFormValues }) =>
      updateHangMucThuChi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANG_MUC_THU_CHI_QUERY_KEY });
      toast.success(i18n.t('thietLapQuy.hangMuc.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateHangMucThuChiStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThaiHoatDong }) =>
      updateHangMucThuChiStatus(ids, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: HANG_MUC_THU_CHI_QUERY_KEY });
      toast.success(i18n.t('thietLapQuy.hangMuc.toast.statusUpdate', { count: v.ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteHangMucThuChiList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteHangMucThuChiList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: HANG_MUC_THU_CHI_QUERY_KEY });
      toast.success(i18n.t('thietLapQuy.hangMuc.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
