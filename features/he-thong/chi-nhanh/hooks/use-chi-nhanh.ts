import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranches,
  updateBranchStatus,
} from '../services/chi-nhanh-service';
import { BranchFormValues } from '../core/schema';
import type { TrangThai } from '../../../../lib/constants';

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    // Ref tĩnh: chi nhánh hiếm khi thay đổi trong phiên. Mutation CRUD đã invalidate khi sửa.
    staleTime: 1000 * 60 * 60 * 4, // 4h
    gcTime: 1000 * 60 * 60 * 24, // 24h (đồng bộ persister)
  });
};

export const useCreateBranch = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(i18n.t('branch.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`),
  });
};

export const useUpdateBranch = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchFormValues }) => updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(i18n.t('branch.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`),
  });
};

export const useUpdateStatusBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThai }) => updateBranchStatus(ids, status),
    onSuccess: (_updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(i18n.t('branch.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useDeleteBranches = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteBranches(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(i18n.t('branch.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};
