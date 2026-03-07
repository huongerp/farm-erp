import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllNhaCungCap,
  getNhaCungCapById,
  getAllNhomNhaCungCap,
  getAllTag,
  createTag,
  createNhaCungCap,
  updateNhaCungCap,
  deleteNhaCungCap,
  deleteNhaCungCapMany,
} from '../services/nha-cung-cap-service';
import type { NhaCungCapFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY_NCC = ['nhaCungCap'] as const;
const QUERY_KEY_NHOM = ['nhomNhaCungCap'] as const;
const QUERY_KEY_TAG = ['tagNhaCungCap'] as const;

export const useNhaCungCapList = () => {
  return useQuery({
    queryKey: QUERY_KEY_NCC,
    queryFn: getAllNhaCungCap,
    staleTime: 1000 * 60 * 5,
  });
};

export const useNhaCungCapById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY_NCC, id],
    queryFn: () => getNhaCungCapById(id!),
    enabled: !!id,
  });
};

export const useNhomNhaCungCapList = () => {
  return useQuery({
    queryKey: QUERY_KEY_NHOM,
    queryFn: getAllNhomNhaCungCap,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTagList = () => {
  return useQuery({
    queryKey: QUERY_KEY_TAG,
    queryFn: getAllTag,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ten_tag: string) => createTag(ten_tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_TAG });
      toast.success(i18n.t('nhaCungCap.toast.tagCreateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCreateNhaCungCap = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNhaCungCap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NCC });
      toast.success(i18n.t('nhaCungCap.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateNhaCungCap = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NhaCungCapFormValues }) => updateNhaCungCap(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NCC });
      toast.success(i18n.t('nhaCungCap.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteNhaCungCap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNhaCungCap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NCC });
      toast.success(i18n.t('nhaCungCap.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteNhaCungCapMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNhaCungCapMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NCC });
      toast.success(i18n.t('nhaCungCap.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
