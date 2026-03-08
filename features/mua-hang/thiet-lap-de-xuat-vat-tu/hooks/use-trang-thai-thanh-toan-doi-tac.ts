import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getTrangThaiThanhToanDoiTacList,
  createTrangThaiThanhToanDoiTac,
  updateTrangThaiThanhToanDoiTac,
  deleteTrangThaiThanhToanDoiTacList,
  updateTrangThaiThanhToanDoiTacStatus,
} from '../services/trang-thai-thanh-toan-doi-tac-service';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import type { TrangThaiThanhToanDoiTacFormValues } from '../core/schema';

export const TRANG_THAI_THANH_TOAN_DOI_TAC_QUERY_KEY = ['trangThaiThanhToanDoiTac'];

export const useTrangThaiThanhToanDoiTacList = () =>
  useQuery({
    queryKey: TRANG_THAI_THANH_TOAN_DOI_TAC_QUERY_KEY,
    queryFn: getTrangThaiThanhToanDoiTacList,
  });

export const useCreateTrangThaiThanhToanDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TrangThaiThanhToanDoiTacFormValues) => createTrangThaiThanhToanDoiTac(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_THANH_TOAN_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.thanhToan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTrangThaiThanhToanDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrangThaiThanhToanDoiTacFormValues }) => updateTrangThaiThanhToanDoiTac(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_THANH_TOAN_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.thanhToan.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateTrangThaiThanhToanDoiTacStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThaiHoatDong }) => updateTrangThaiThanhToanDoiTacStatus(ids, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_THANH_TOAN_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.thanhToan.toast.statusUpdate', { count: v.ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteTrangThaiThanhToanDoiTacList = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTrangThaiThanhToanDoiTacList(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: TRANG_THAI_THANH_TOAN_DOI_TAC_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.thanhToan.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
