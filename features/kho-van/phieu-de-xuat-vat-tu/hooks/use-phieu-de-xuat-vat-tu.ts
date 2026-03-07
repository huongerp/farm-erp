import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllPhieuDeXuatVatTu,
  getPhieuDeXuatVatTuById,
  createPhieuDeXuatVatTu,
  updatePhieuDeXuatVatTu,
  deletePhieuDeXuatVatTu,
  deletePhieuDeXuatVatTuMany,
} from '../services/phieu-de-xuat-vat-tu-service';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['phieuDeXuatVatTu'] as const;

export const usePhieuDeXuatVatTuList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllPhieuDeXuatVatTu,
    staleTime: 1000 * 60 * 2,
  });
};

export const usePhieuDeXuatVatTuById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getPhieuDeXuatVatTuById(id!),
    enabled: !!id,
  });
};

export const useCreatePhieuDeXuatVatTu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuDeXuatVatTuFormValues) => createPhieuDeXuatVatTu(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuDeXuatVatTu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuDeXuatVatTuFormValues }) =>
      updatePhieuDeXuatVatTu(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuDeXuatVatTu = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuDeXuatVatTu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuDeXuatVatTuMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuDeXuatVatTuMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
