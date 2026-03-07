import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getPayrollPointGroups,
  createPayrollPointGroup,
  updatePayrollPointGroup,
  deletePayrollPointGroups,
  updatePayrollPointGroupStatus,
} from '../services/payroll-point-group-service';
import { PayrollPointGroupFormValues } from '../core/schema';

export const usePayrollPointGroups = () =>
  useQuery({
    queryKey: ['payrollPointGroups'],
    queryFn: getPayrollPointGroups,
  });

export const useCreatePayrollPointGroup = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PayrollPointGroupFormValues) => createPayrollPointGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollPointGroups'] });
      toast.success(i18n.t('payrollIp.pointGroups.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdatePayrollPointGroup = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayrollPointGroupFormValues }) =>
      updatePayrollPointGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollPointGroups'] });
      toast.success(i18n.t('payrollIp.pointGroups.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdatePayrollPointGroupStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) =>
      updatePayrollPointGroupStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payrollPointGroups'] });
      toast.success(i18n.t('payrollIp.pointGroups.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeletePayrollPointGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePayrollPointGroups(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payrollPointGroups'] });
      toast.success(i18n.t('payrollIp.pointGroups.toast.deleteSuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
