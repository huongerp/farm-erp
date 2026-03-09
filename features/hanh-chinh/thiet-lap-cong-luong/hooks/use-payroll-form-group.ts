import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getPayrollAdminFormGroups,
  createPayrollAdminFormGroup,
  updatePayrollAdminFormGroup,
  deletePayrollAdminFormGroups,
  updatePayrollAdminFormGroupStatus,
} from '../services/payroll-form-group-service';
import { PayrollAdminFormGroupFormValues } from '../core/schema';

export const usePayrollAdminFormGroups = () =>
  useQuery({
    queryKey: ['payrollAdminFormGroups'],
    queryFn: getPayrollAdminFormGroups,
  });

export const useCreatePayrollAdminFormGroup = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PayrollAdminFormGroupFormValues) => createPayrollAdminFormGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollAdminFormGroups'] });
      toast.success(i18n.t('payrollIp.groups.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useUpdatePayrollAdminFormGroup = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayrollAdminFormGroupFormValues }) =>
      updatePayrollAdminFormGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollAdminFormGroups'] });
      toast.success(i18n.t('payrollIp.groups.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useUpdatePayrollAdminFormGroupStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: import('../../../../lib/constants').TrangThaiHoatDong }) =>
      updatePayrollAdminFormGroupStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payrollAdminFormGroups'] });
      toast.success(i18n.t('payrollIp.groups.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useDeletePayrollAdminFormGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePayrollAdminFormGroups(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payrollAdminFormGroups'] });
      toast.success(i18n.t('payrollIp.groups.toast.deleteSuccess', { count: variables.length }));
    },
    onError: (err: any) => toast.error(err.message),
  });
};
