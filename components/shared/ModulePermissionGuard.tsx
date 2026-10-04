import React, { createContext, useContext } from 'react';
import TrangTrangThai from './TrangTrangThai';
import { useModulePermission, type ModulePermissionFlags } from '@/features/he-thong/phan-quyen/hooks/use-module-permission';

const ModulePermissionContext = createContext<ModulePermissionFlags | null>(null);

/**
 * Hook lấy phân quyền module khi component nằm trong ModulePermissionGuard.
 * Ngoài guard trả về { canView: true, canCreate: true, canUpdate: true, canDelete: true } (không ẩn nút).
 */
export function useModulePermissionFromContext(): ModulePermissionFlags {
  const ctx = useContext(ModulePermissionContext);
  if (ctx) return ctx;
  return {
    canView: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canApprove: true,
    canAdmin: true,
    isLoading: false,
  };
}

interface ModulePermissionGuardProps {
  moduleId: string;
  children: React.ReactNode;
}

/**
 * Bọc nội dung theo phân quyền module: không có quyền xem thì hiển thị thông báo, có thì render children và cung cấp context canCreate/canUpdate/canDelete.
 */
const ModulePermissionGuard: React.FC<ModulePermissionGuardProps> = ({ moduleId, children }) => {
  const { canView, canCreate, canUpdate, canDelete, canApprove, canAdmin, isLoading } = useModulePermission(moduleId);

  if (!isLoading && !canView) {
    return <TrangTrangThai loai="403" />;
  }

  return (
    <ModulePermissionContext.Provider
      value={{ canView, canCreate, canUpdate, canDelete, canApprove, canAdmin, isLoading }}
    >
      {children}
    </ModulePermissionContext.Provider>
  );
};

export default ModulePermissionGuard;
