import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useCurrentRoleContext } from './use-phan-quyen';
import type { ActionType } from '../core/types';
import {
  getModuleIdsBySubmenuPath,
  isSubmenuWithPermission,
  getPermissionModuleIdFromPath,
} from '../core/permission-modules-config';

export interface ModulePermissionFlags {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canAdmin: boolean;
  isLoading: boolean;
}

/**
 * Kiểm tra quyền theo module của user đăng nhập (dựa trên chức vụ id_chuc_vu).
 * Dữ liệu từ getCurrentRoleContext (nhẹ), không tải getRoles toàn phần.
 */
export function useModulePermission(moduleId: string): ModulePermissionFlags {
  const user = useAuthStore((s) => s.user);
  const { data, isPending } = useCurrentRoleContext();

  return useMemo(() => {
    const noPermission: ModulePermissionFlags = {
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canApprove: false,
      canAdmin: false,
      isLoading: !!user?.id_chuc_vu && isPending,
    };

    if (user?.id_chuc_vu && isPending) return noPermission;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return { ...noPermission, isLoading: false };

    const quyenHan = data?.quyenHan ?? [];
    const modulePerm = quyenHan.find((q) => q.module_id === moduleId);
    const actions: ActionType[] = modulePerm?.actions ?? [];

    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');

    return {
      canView: hasAdminOrAll || has('view'),
      canCreate: hasAdminOrAll || has('create'),
      canUpdate: hasAdminOrAll || has('update'),
      canDelete: hasAdminOrAll || has('delete'),
      canApprove: hasAdminOrAll || has('approve'),
      canAdmin: hasAdminOrAll,
      isLoading: false,
    };
  }, [moduleId, user?.id_chuc_vu, data, isPending]);
}

export function useSubmenuVisible(path: string): boolean {
  const user = useAuthStore((s) => s.user);
  const { data, isPending } = useCurrentRoleContext();

  return useMemo(() => {
    if (!isSubmenuWithPermission(path)) return true;
    if (user?.id_chuc_vu && isPending) return false;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return false;

    const moduleIds = getModuleIdsBySubmenuPath(path);
    if (moduleIds.length === 0) return true;

    const quyenHan = data?.quyenHan ?? [];

    const hasView = (actions: ActionType[]) =>
      actions.includes('admin') || actions.includes('all') || actions.includes('view');

    return moduleIds.some((moduleId) => {
      const modulePerm = quyenHan.find((q) => q.module_id === moduleId);
      const actions: ActionType[] = modulePerm?.actions ?? [];
      return hasView(actions);
    });
  }, [path, user?.id_chuc_vu, data, isPending]);
}

export function useModulesWithViewPermission(path: string): Set<string> {
  const user = useAuthStore((s) => s.user);
  const { data, isPending } = useCurrentRoleContext();

  return useMemo(() => {
    const viewable = new Set<string>();
    if (!isSubmenuWithPermission(path)) return viewable;
    if (user?.id_chuc_vu && isPending) return viewable;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return viewable;

    const moduleIds = getModuleIdsBySubmenuPath(path);
    const quyenHan = data?.quyenHan ?? [];

    const hasView = (actions: ActionType[]) =>
      actions.includes('admin') || actions.includes('all') || actions.includes('view');

    moduleIds.forEach((moduleId) => {
      const modulePerm = quyenHan.find((q) => q.module_id === moduleId);
      const actions: ActionType[] = modulePerm?.actions ?? [];
      if (hasView(actions)) viewable.add(moduleId);
    });
    return viewable;
  }, [path, user?.id_chuc_vu, data, isPending]);
}

export { isSubmenuWithPermission, getModuleIdsBySubmenuPath, getPermissionModuleIdFromPath };
