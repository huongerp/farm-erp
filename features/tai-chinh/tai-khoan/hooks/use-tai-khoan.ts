import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTaiKhoanList,
  createTaiKhoan,
  updateTaiKhoan,
  deleteTaiKhoan,
  deleteTaiKhoanMany,
} from '../services/tai-khoan-service';
import type { TaiKhoanFormValues } from '../core/schema';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['tai-khoan'];

export const useTaiKhoan = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getTaiKhoanList,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateTaiKhoan = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaiKhoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('taiKhoan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateTaiKhoan = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaiKhoanFormValues }) =>
      updateTaiKhoan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('taiKhoan.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteTaiKhoan = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaiKhoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('taiKhoan.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteTaiKhoanMany = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTaiKhoanMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('taiKhoan.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
