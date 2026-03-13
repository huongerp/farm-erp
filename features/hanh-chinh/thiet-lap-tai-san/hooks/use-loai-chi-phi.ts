import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getLoaiChiPhiList,
  createLoaiChiPhi,
  updateLoaiChiPhi,
  deleteLoaiChiPhiList,
  updateLoaiChiPhiStatus,
} from '../services/loai-chi-phi-service';
import { LoaiChiPhiFormValues } from '../core/schema';

export const useLoaiChiPhiList = () => {
  return useQuery({
    queryKey: ['loaiChiPhi'],
    queryFn: getLoaiChiPhiList,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateLoaiChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLoaiChiPhi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loaiChiPhi'] });
      toast.success(i18n.t('thietLapTaiSan.loaiChiPhi.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateLoaiChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoaiChiPhiFormValues }) =>
      updateLoaiChiPhi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loaiChiPhi'] });
      toast.success(i18n.t('thietLapTaiSan.loaiChiPhi.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateLoaiChiPhiStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: import('../../../../lib/constants').TrangThaiHoatDong }) =>
      updateLoaiChiPhiStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loaiChiPhi'] });
      toast.success(i18n.t('thietLapTaiSan.loaiChiPhi.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteLoaiChiPhiList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteLoaiChiPhiList(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['loaiChiPhi'] });
      toast.success(i18n.t('thietLapTaiSan.loaiChiPhi.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
