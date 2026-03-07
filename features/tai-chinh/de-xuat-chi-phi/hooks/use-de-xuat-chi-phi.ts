import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllDeXuatChiPhi,
  getDeXuatChiPhiById,
  createDeXuatChiPhi,
  updateDeXuatChiPhi,
  deleteDeXuatChiPhi,
  deleteDeXuatChiPhiMany,
  approveDeXuatChiPhi,
  rejectDeXuatChiPhi,
  type ApproveRejectPayload,
} from '../services/de-xuat-chi-phi-service';
import type { DeXuatChiPhiFormValues } from '../core/schema';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['de-xuat-chi-phi'];

export const useDeXuatChiPhiList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllDeXuatChiPhi,
    staleTime: 1000 * 60 * 5,
  });
};

export const useDeXuatChiPhiById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getDeXuatChiPhiById(id!),
    enabled: !!id,
  });
};

export const useCreateDeXuatChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeXuatChiPhi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('deXuatChiPhi.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDeXuatChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeXuatChiPhiFormValues }) =>
      updateDeXuatChiPhi(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      toast.success(i18n.t('deXuatChiPhi.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDeXuatChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeXuatChiPhi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('deXuatChiPhi.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDeXuatChiPhiMany = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeXuatChiPhiMany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('deXuatChiPhi.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useApproveDeXuatChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveRejectPayload }) =>
      approveDeXuatChiPhi(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      toast.success(i18n.t('deXuatChiPhi.toast.approveSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useRejectDeXuatChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveRejectPayload }) =>
      rejectDeXuatChiPhi(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      toast.success(i18n.t('deXuatChiPhi.toast.rejectSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
