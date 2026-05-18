import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

/** Phân quyền module thống kê sản xuất (read-only — chỉ cần canView). */
export function useThongKeSanXuatPermissions() {
  const { canView, isLoading } = useModulePermissionFromContext();
  return { canView, isLoading };
}
