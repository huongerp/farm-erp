import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllNhaCungCap,
  getNhaCungCapById,
  createNhaCungCap,
  updateNhaCungCap,
  deleteNhaCungCap,
  deleteNhaCungCapMany,
  getAllNhomDoiTac,
  getAllTag,
  createTag,
} from '../services/nha-cung-cap-service';
import type { NhaCungCapFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['nhaCungCapMuaHang'] as const;

export const useNhaCungCapList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllNhaCungCap,
    staleTime: 1000 * 60 * 5,
  });
};

export const useNhaCungCapById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getNhaCungCapById(id!),
    enabled: !!id,
  });
};

export const useCreateNhaCungCap = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NhaCungCapFormValues) => createNhaCungCap(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('nhaCungCapMuaHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateNhaCungCap = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NhaCungCapFormValues }) =>
      updateNhaCungCap(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('nhaCungCapMuaHang.toast.updateSuccess'));
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
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('nhaCungCapMuaHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteNhaCungCapMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNhaCungCapMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('nhaCungCapMuaHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

const NHOM_QUERY_KEY = [...QUERY_KEY, 'nhom'] as const;
const TAG_QUERY_KEY = [...QUERY_KEY, 'tag'] as const;

export const useNhomDoiTacList = () => {
  return useQuery({
    queryKey: NHOM_QUERY_KEY,
    queryFn: getAllNhomDoiTac,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTagList = () => {
  return useQuery({
    queryKey: TAG_QUERY_KEY,
    queryFn: getAllTag,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TAG_QUERY_KEY });
      toast.success(i18n.t('nhaCungCapMuaHang.toast.tagCreateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
