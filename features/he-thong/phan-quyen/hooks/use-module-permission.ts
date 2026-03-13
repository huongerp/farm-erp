import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useRoles } from './use-phan-quyen';
import type { ActionType } from '../core/types';
import { getModuleIdsBySubmenuPath, isSubmenuWithPermission } from '../core/permission-modules-config';

export interface ModulePermissionFlags {
  /** Có quyền xem (admin | all | view) */
  canView: boolean;
  /** Có quyền thêm (admin | all | create) */
  canCreate: boolean;
  /** Có quyền sửa (admin | all | update) */
  canUpdate: boolean;
  /** Có quyền xoá (admin | all | delete) */
  canDelete: boolean;
  /** Đang tải dữ liệu phân quyền */
  isLoading: boolean;
}

/**
 * Kiểm tra quyền theo module của user đăng nhập (dựa trên chức vụ id_chuc_vu).
 * Quy tắc: quan_tri (admin) hoặc all = đủ mọi quyền; ngoài ra cần từng action view/create/update/delete.
 */
export function useModulePermission(moduleId: string): ModulePermissionFlags {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading } = useRoles();

  return useMemo(() => {
    const noPermission: ModulePermissionFlags = {
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      isLoading,
    };

    if (isLoading) return noPermission;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return noPermission;

    const role = roles.find((r) => String(r.id_chuc_vu) === String(chucVuId));
    const modulePerm = role?.quyen_han?.find((q) => q.module_id === moduleId);
    const actions: ActionType[] = modulePerm?.actions ?? [];

    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');

    return {
      canView: hasAdminOrAll || has('view'),
      canCreate: hasAdminOrAll || has('create'),
      canUpdate: hasAdminOrAll || has('update'),
      canDelete: hasAdminOrAll || has('delete'),
      isLoading,
    };
  }, [moduleId, user?.id_chuc_vu, roles, isLoading]);
}

/**
 * Trả về true nếu submenu (path) nên hiển thị: không dùng phân quyền thì luôn true;
 * nếu dùng phân quyền thì true khi có ít nhất một module trong submenu mà user có quyền xem.
 */
export function useSubmenuVisible(path: string): boolean {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading } = useRoles();

  return useMemo(() => {
    if (!isSubmenuWithPermission(path)) return true;
    if (isLoading) return true; // Trong lúc tải: hiển thị, tránh nháy

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return false;

    const moduleIds = getModuleIdsBySubmenuPath(path);
    if (moduleIds.length === 0) return true;

    const role = roles.find((r) => String(r.id_chuc_vu) === String(chucVuId));
    if (!role) return false;

    const hasView = (actions: ActionType[]) =>
      actions.includes('admin') || actions.includes('all') || actions.includes('view');

    return moduleIds.some((moduleId) => {
      const modulePerm = role.quyen_han?.find((q) => q.module_id === moduleId);
      const actions: ActionType[] = modulePerm?.actions ?? [];
      return hasView(actions);
    });
  }, [path, user?.id_chuc_vu, roles, isLoading]);
}

export { isSubmenuWithPermission, getModuleIdsBySubmenuPath };
