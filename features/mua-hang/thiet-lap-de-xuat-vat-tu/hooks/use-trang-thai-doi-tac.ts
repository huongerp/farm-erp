import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getTrangThaiDoiTacList,
  createTrangThaiDoiTac,
  updateTrangThaiDoiTac,
  deleteTrangThaiDoiTacList,
  updateTrangThaiDoiTacStatus,
} from '../services/trang-thai-doi-tac-service';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import type { TrangThaiDoiTacFormValues } from '../core/schema';

export const TRANG_THAI_DOI_TAC_QUERY_KEY = ['trangThaiDoiTac'];

export const useTrangThaiDoiTacList = () =>
  useQuery({
    queryKey: TRANG_THAI_DOI_TAC_QUERY_KEY,
    queryFn: getTrangThaiDoiTacList,
  });

export const useCreateTrangThaiDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TrangThaiDoiTacFormValues) => createTrangThaiDoiTac(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.doiTac.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTrangThaiDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrangThaiDoiTacFormValues }) => updateTrangThaiDoiTac(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.doiTac.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTrangThaiDoiTacStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThaiHoatDong }) => updateTrangThaiDoiTacStatus(ids, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.doiTac.toast.statusUpdate', { count: v.ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteTrangThaiDoiTacList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTrangThaiDoiTacList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.doiTac.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
