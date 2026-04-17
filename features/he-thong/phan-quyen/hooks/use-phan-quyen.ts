import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoles,
  createRole,
  deleteRoles,
  updateModulePermissions,
  getLogs,
  getCurrentRoleContext,
} from '../services/phan-quyen-service';
import { RoleFormValues } from '../core/schema';
import { ModulePermission } from '../core/types';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';

/** Query key cho quyền của user đăng nhập (prefetch sau login / gate app). */
export const CURRENT_ROLE_CONTEXT_KEY = 'current-role-context' as const;

/** Quyền + thứ tự chức vụ hiện tại — truy vấn nhẹ, không dùng getRoles() toàn phần. */
export const useCurrentRoleContext = () => {
  const chucVuId = useAuthStore((s) => s.user?.id_chuc_vu);
  return useQuery({
    queryKey: [CURRENT_ROLE_CONTEXT_KEY, chucVuId ?? null],
    queryFn: () => getCurrentRoleContext(String(chucVuId)),
    enabled: !!chucVuId,
    staleTime: 30 * 60 * 1000,
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    staleTime: 30 * 60 * 1000,
  });
};

export const useCreateRole = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, permissions }: { data: RoleFormValues, permissions: ModulePermission[] }) => createRole(data, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: [CURRENT_ROLE_CONTEXT_KEY] });
      toast.success(i18n.t('permission.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(err.message)
  });
};

export const useDeleteRoles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteRoles(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: [CURRENT_ROLE_CONTEXT_KEY] });
      toast.success(i18n.t('permission.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err?.message ?? i18n.t('permission.matrix.loading')),
  });
};

export const useUpdateModulePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, updates }: { moduleId: string, updates: { roleId: string, actions: any[] }[] }) => updateModulePermissions(moduleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: [CURRENT_ROLE_CONTEXT_KEY] });
      toast.success(i18n.t('permission.toast.updateSuccess'));
    },
    onError: (err: any) => toast.error(err.message)
  });
};

export const useAccessLogs = () => {
  return useQuery({
    queryKey: ['access-logs'],
    queryFn: getLogs,
    staleTime: 1000 * 60 * 5,
  });
};
