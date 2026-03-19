import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useRoles } from './use-phan-quyen';
import type { ActionType } from '../core/types';
import {
  getModuleIdsBySubmenuPath,
  isSubmenuWithPermission,
  getPermissionModuleIdFromPath,
} from '../core/permission-modules-config';

export interface ModulePermissionFlags {
  /** Có quyền xem (admin | all | view) */
  canView: boolean;
  /** Có quyền thêm (admin | all | create) */
  canCreate: boolean;
  /** Có quyền sửa (admin | all | update) */
  canUpdate: boolean;
  /** Có quyền xoá (admin | all | delete) */
  canDelete: boolean;
  /** Có quyền phê duyệt (admin | all | approve) – chỉ ý nghĩa với module có chức năng phê duyệt */
  canApprove: boolean;
  /** Có quyền quản trị (chỉ admin | all) – dùng cho hành động đặc biệt như chuyển trạng thái */
  canAdmin: boolean;
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
      canApprove: false,
      canAdmin: false,
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
      canApprove: hasAdminOrAll || has('approve'),
      canAdmin: hasAdminOrAll,
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

/**
 * Trả về Set các module id mà user có quyền xem trong submenu (path).
 * Dùng để lọc thẻ module trên dashboard (chỉ hiển thị module user được xem).
 */
export function useModulesWithViewPermission(path: string): Set<string> {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading } = useRoles();

  return useMemo(() => {
    const viewable = new Set<string>();
    if (!isSubmenuWithPermission(path)) return viewable;
    if (isLoading) return viewable;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return viewable;

    const moduleIds = getModuleIdsBySubmenuPath(path);
    const role = roles.find((r) => String(r.id_chuc_vu) === String(chucVuId));
    if (!role) return viewable;

    const hasView = (actions: ActionType[]) =>
      actions.includes('admin') || actions.includes('all') || actions.includes('view');

    moduleIds.forEach((moduleId) => {
      const modulePerm = role.quyen_han?.find((q) => q.module_id === moduleId);
      const actions: ActionType[] = modulePerm?.actions ?? [];
      if (hasView(actions)) viewable.add(moduleId);
    });
    return viewable;
  }, [path, user?.id_chuc_vu, roles, isLoading]);
}

export { isSubmenuWithPermission, getModuleIdsBySubmenuPath, getPermissionModuleIdFromPath };
