import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllDoiTac,
  getDoiTacById,
  getAllNhomDoiTac,
  getAllTag,
  createTag,
  deleteTag,
  updateTag,
  createNhomDoiTac,
  updateNhomDoiTac,
  deleteNhomDoiTac,
  deleteNhomDoiTacMany,
  deleteTagMany,
  createDoiTac,
  updateDoiTac,
  deleteDoiTac,
  deleteDoiTacMany,
} from '../services/doi-tac-service';
import type { DoiTacFormValues } from '../core/schema';
import type { NhomDoiTacFormValues } from '../services/doi-tac-service';
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

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_TAG });
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.tagDeleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateTag = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ten_tag }: { id: string; ten_tag: string }) => updateTag(id, ten_tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_TAG });
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.tagUpdateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCreateNhomDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNhomDoiTac,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NHOM });
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.nhomCreateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateNhomDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NhomDoiTacFormValues }) => updateNhomDoiTac(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NHOM });
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.nhomUpdateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteNhomDoiTac = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNhomDoiTac,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NHOM });
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.nhomDeleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteNhomDoiTacMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNhomDoiTacMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_NHOM });
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.nhomDeleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteTagMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTagMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_TAG });
      qc.invalidateQueries({ queryKey: QUERY_KEY_DOI_TAC });
      toast.success(i18n.t('doiTac.toast.tagDeleteSuccess'));
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
