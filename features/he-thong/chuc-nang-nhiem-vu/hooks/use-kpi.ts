import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getKpiIndicators,
  getKpiIndicatorsByTask,
  createKpiIndicator,
  updateKpiIndicator,
  deleteKpiIndicators,
  updateKpiIndicatorStatus,
} from '../services/kpi-service';
import type { KpiIndicatorFormValues } from '../core/schema';

const t = (key: string) => i18n.t(key);

export const useKpiIndicators = () =>
  useQuery({ queryKey: ['kpi'], queryFn: getKpiIndicators, staleTime: 1000 * 60 * 5 });

export const useKpiIndicatorsByTask = (idNhiemVu: string | null) =>
  useQuery({
    queryKey: ['kpi', idNhiemVu],
    queryFn: () => (idNhiemVu ? getKpiIndicatorsByTask(idNhiemVu) : Promise.resolve([])),
    enabled: !!idNhiemVu,
  });

export const useCreateKpiIndicator = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createKpiIndicator,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi'] });
      toast.success(t('chucNangNhiemVu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useUpdateKpiIndicator = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KpiIndicatorFormValues }) => updateKpiIndicator(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi'] });
      toast.success(t('chucNangNhiemVu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useDeleteKpiIndicators = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteKpiIndicators,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi'] });
      toast.success(t('chucNangNhiemVu.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useUpdateKpiIndicatorStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) => updateKpiIndicatorStatus(ids, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi'] });
      toast.success(t('chucNangNhiemVu.toast.statusUpdate'));
    },
    onError: (err: any) => toast.error(err?.message),
  });
};
