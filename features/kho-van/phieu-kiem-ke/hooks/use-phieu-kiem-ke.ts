import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllPhieuKiemKe,
  getPhieuKiemKeById,
  createPhieuKiemKe,
  updatePhieuKiemKe,
  deletePhieuKiemKe,
  deletePhieuKiemKeMany,
  getNextSoPhieuPhieuKiemKe,
} from '../services/phieu-kiem-ke-service';
import type { PhieuKiemKeFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['phieuKiemKe'] as const;

export const usePhieuKiemKeList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllPhieuKiemKe,
    staleTime: 1000 * 60 * 2,
  });
};

export const usePhieuKiemKeById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getPhieuKiemKeById(id!),
    enabled: !!id,
  });
};

export const useCreatePhieuKiemKe = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuKiemKeFormValues) => createPhieuKiemKe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuKiemKe.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuKiemKe = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuKiemKeFormValues }) => updatePhieuKiemKe(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuKiemKe.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuKiemKe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKiemKe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuKiemKe.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuKiemKeMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKiemKeMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('phieuKiemKe.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useNextSoPhieuPhieuKiemKe = () => {
  return useMutation({
    mutationFn: getNextSoPhieuPhieuKiemKe,
  });
};
