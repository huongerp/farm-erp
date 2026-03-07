import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllThanhToanDoiTac,
  getThanhToanDoiTacById,
  createThanhToanDoiTac,
  updateThanhToanDoiTac,
  deleteThanhToanDoiTac,
  deleteThanhToanDoiTacMany,
} from '../services/thanh-toan-doi-tac-service';
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['thanhToanDoiTac'] as const;

export const useThanhToanDoiTacList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllThanhToanDoiTac,
    staleTime: 1000 * 60 * 2,
  });
};

export const useThanhToanDoiTacById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getThanhToanDoiTacById(id!),
    enabled: !!id,
  });
};

export const useCreateThanhToanDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ThanhToanDoiTacFormValues) => createThanhToanDoiTac(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateThanhToanDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThanhToanDoiTacFormValues }) =>
      updateThanhToanDoiTac(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteThanhToanDoiTac = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteThanhToanDoiTac,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteThanhToanDoiTacMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteThanhToanDoiTacMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
