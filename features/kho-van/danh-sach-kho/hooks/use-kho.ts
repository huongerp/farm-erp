import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getKhoList,
  getKhoById,
  createKho,
  updateKho,
  updateKhoStatus,
  deleteKho,
  deleteKhoMany,
  importKho,
} from '../services/kho-service';
import type { KhoFormValues } from '../core/schema';
import type { Kho } from '../core/types';
import i18n from '../../../../lib/i18n';
import { invalidateRefCache } from '../../../../lib/ref-cache';

const QUERY_KEY = ['kho'] as const;

export const useKhoList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getKhoList,
    staleTime: 1000 * 60 * 30,
  });
};

export const useKhoById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getKhoById(id!),
    enabled: !!id,
  });
};

export const useCreateKho = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createKho,
    onSuccess: () => {
      invalidateRefCache('kho');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('kho.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateKho = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KhoFormValues }) => updateKho(id, data),
    onSuccess: () => {
      invalidateRefCache('kho');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('kho.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateKhoStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Kho['trang_thai'] }) => updateKhoStatus(id, status),
    onSuccess: () => {
      invalidateRefCache('kho');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('kho.toast.updateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteKho = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteKho,
    onSuccess: () => {
      invalidateRefCache('kho');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('kho.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteKhoMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteKhoMany,
    onSuccess: () => {
      invalidateRefCache('kho');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('kho.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/** Import Excel: lỗi từng dòng trả về trong `errors` để ImportDialog hiển thị. */
export const useImportKho = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: importKho,
    onSuccess: (result) => {
      if (result.created === 0) return;
      invalidateRefCache('kho');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('kho.toast.importSuccess', { count: result.created }));
    },
  });
};
