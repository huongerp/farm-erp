import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllDanhMucTaiChinh,
  createDanhMucTaiChinh,
  updateDanhMucTaiChinh,
  deleteDanhMucTaiChinh,
  deleteDanhMucTaiChinhMany,
} from '../services/danh-muc-tai-chinh-service';
import type { HangMucTaiChinhFormValues } from '../core/schema';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['danh-muc-tai-chinh'];

export const useDanhMucTaiChinh = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllDanhMucTaiChinh,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateDanhMucTaiChinh = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDanhMucTaiChinh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('danhMucTaiChinh.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDanhMucTaiChinh = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HangMucTaiChinhFormValues }) =>
      updateDanhMucTaiChinh(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('danhMucTaiChinh.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDanhMucTaiChinh = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDanhMucTaiChinh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['hang-muc-quyen-all'] });
      toast.success(i18n.t('danhMucTaiChinh.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDanhMucTaiChinhMany = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDanhMucTaiChinhMany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['hang-muc-quyen-all'] });
      toast.success(i18n.t('danhMucTaiChinh.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
