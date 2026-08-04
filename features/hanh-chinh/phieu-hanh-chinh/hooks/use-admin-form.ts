import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getAdminForms,
  getAdminFormsByUserAndMonth,
  createAdminForm,
  updateAdminForm,
  cancelAdminForm,
  deleteAdminForm,
  deleteAdminForms,
  cancelAdminForms,
  approveAdminFormsByManager,
  rejectAdminFormsByManager,
  approveAdminFormsByHcns,
  rejectAdminFormsByHcns,
  approveAdminFormByManager,
  rejectAdminFormByManager,
  approveAdminFormByHcns,
  rejectAdminFormByHcns,
  updateAdminFormGhiChu,
} from '../services/admin-form-service';
import { AdminFormValues } from '../core/schema';

export const useAdminForms = () =>
  useQuery({
    queryKey: ['adminForms'],
    queryFn: getAdminForms,
  });

export const useAdminFormsByUserMonth = (
  userId: string,
  monthKey: string,
  enabled = true
) =>
  useQuery({
    queryKey: ['adminForms', 'byUserMonth', userId, monthKey],
    queryFn: () => getAdminFormsByUserAndMonth(userId, monthKey),
    enabled: !!userId && !!monthKey && enabled,
  });

export const useCreateAdminForm = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, creator }: { data: AdminFormValues; creator: { id: string; name: string } }) =>
      createAdminForm(data, creator),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useUpdateAdminForm = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminFormValues }) => updateAdminForm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useUpdateAdminFormGhiChu = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ghiChu }: { id: string; ghiChu: string | null }) => updateAdminFormGhiChu(id, ghiChu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useCancelAdminForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelAdminForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.cancelSuccess'));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useDeleteAdminForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.deleteSuccess'));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useDeleteAdminForms = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteAdminForms(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.deleteSuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useCancelAdminForms = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => cancelAdminForms(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.cancelManySuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useApproveAdminFormsByManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => approveAdminFormsByManager(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.approveManySuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useRejectAdminFormsByManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => rejectAdminFormsByManager(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.rejectManySuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useApproveAdminFormsByHcns = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => approveAdminFormsByHcns(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.approveHrManySuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useRejectAdminFormsByHcns = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => rejectAdminFormsByHcns(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.rejectHrManySuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useApproveAdminFormByManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAdminFormByManager(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.approveSuccess'));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useRejectAdminFormByManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectAdminFormByManager(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.rejectSuccess'));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useApproveAdminFormByHcns = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAdminFormByHcns(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.approveHrSuccess'));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useRejectAdminFormByHcns = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectAdminFormByHcns(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminForms'] });
      toast.success(i18n.t('adminForm.toast.rejectHrSuccess'));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};
