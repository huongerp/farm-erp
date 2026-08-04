import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getPayrollWifiIps,
  createPayrollWifiIp,
  updatePayrollWifiIp,
  deletePayrollWifiIps,
  updatePayrollWifiIpStatus,
  importPayrollWifiIps,
} from '../services/payroll-wifi-ip-service';
import { PayrollWifiIpFormValues } from '../core/schema';

export const usePayrollWifiIps = () => {
  return useQuery({
    queryKey: ['payrollWifiIps'],
    queryFn: getPayrollWifiIps,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreatePayrollWifiIp = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayrollWifiIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollWifiIps'] });
      toast.success(i18n.t('payrollIp.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`),
  });
};

export const useUpdatePayrollWifiIp = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayrollWifiIpFormValues }) => updatePayrollWifiIp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollWifiIps'] });
      toast.success(i18n.t('payrollIp.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`),
  });
};

export const useUpdatePayrollWifiIpStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: import('../../../../lib/constants').TrangThaiHoatDong }) => updatePayrollWifiIpStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payrollWifiIps'] });
      toast.success(i18n.t('payrollIp.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useDeletePayrollWifiIps = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePayrollWifiIps(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['payrollWifiIps'] });
      toast.success(i18n.t('payrollIp.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useImportPayrollWifiIps = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importPayrollWifiIps,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['payrollWifiIps'] });
      if (result.created > 0) {
        toast.success(i18n.t('payrollIp.importSuccess', { count: result.created }));
      }
      if (result.errors.length > 0) {
        toast.warning(result.errors.slice(0, 3).join('; '));
      }
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};
