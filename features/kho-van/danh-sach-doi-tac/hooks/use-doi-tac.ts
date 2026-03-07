import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllDoiTac,
  getDoiTacById,
  getAllNhomDoiTac,
  getAllTag,
  createTag,
  createDoiTac,
  updateDoiTac,
  deleteDoiTac,
  deleteDoiTacMany,
} from '../services/doi-tac-service';
import type { DoiTacFormValues } from '../core/schema';
import type { LoaiDoiTac } from '../core/types';
import i18n from '../../../../lib/i18n';

const QUERY_KEY_DOI_TAC = ['doiTac'] as const;
const QUERY_KEY_NHOM = ['nhomDoiTac'] as const;
const QUERY_KEY_TAG = ['tagDoiTac'] as const;

export const useDoiTacList = (loai?: LoaiDoiTac) => {
  return useQuery({
    queryKey: [...QUERY_KEY_DOI_TAC, loai ?? 'all'],
    queryFn: () => getAllDoiTac(loai),
    staleTime: 1000 * 60 * 5,
  });
};

export const useDoiTacById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY_DOI_TAC, id],
    queryFn: () => getDoiTacById(id!),
    enabled: !!id,
  });
};

export const useNhomDoiTacList = () => {
  return useQuery({
    queryKey: QUERY_KEY_NHOM,
    queryFn: getAllNhomDoiTac,
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
      toast.success(i18n.t('doiTac.toast.tagCreateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCreateDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDoiTac,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DoiTacFormValues }) => updateDoiTac(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDoiTac = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDoiTac,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDoiTacMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDoiTacMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
