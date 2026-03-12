import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllDonDatHang,
  getDonDatHangById,
  createDonDatHang,
  updateDonDatHang,
  deleteDonDatHang,
  deleteDonDatHangMany,
  getNextSoPoFormatted,
} from '../services/don-dat-hang-service';
import type { DonDatHangFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['donDatHang'] as const;

/** Số PO tiếp theo khi tạo mới (format PO-YYYY-NNNNN). Chỉ gọi khi mở form tạo đơn (enabled = true). Có thể sửa mã trên form. */
export const useNextSoPoDonDatHang = (enabled: boolean) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'nextSoPo'],
    queryFn: getNextSoPoFormatted,
    enabled,
    staleTime: 0,
  });
};

export const useDonDatHangList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllDonDatHang,
    staleTime: 1000 * 60 * 2,
  });
};

export const useDonDatHangById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getDonDatHangById(id!),
    enabled: !!id,
  });
};

export const useCreateDonDatHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DonDatHangFormValues) => createDonDatHang(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDonDatHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DonDatHangFormValues }) =>
      updateDonDatHang(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDonDatHang = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDonDatHang,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDonDatHangMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDonDatHangMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
