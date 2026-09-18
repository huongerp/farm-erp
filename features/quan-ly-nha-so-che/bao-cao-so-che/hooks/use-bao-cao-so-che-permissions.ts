import { useMemo } from 'react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useAuthStore } from '../../../../store/useStore';
import type { FarmBaoCaoSoChe } from '../core/types';
import {
  canCopyBaoCaoSoCheToNextDay,
  canMutateBaoCaoSoChe,
  canToggleTrangThaiBaoCaoSoChe,
} from '../core/permissions';

/** Phân quyền module báo cáo sơ chế (xem / thêm / sửa / xóa / quản trị + quy tắc khóa phiếu). */
export function useBaoCaoSoChePermissions() {
  const { canView, canCreate, canUpdate, canDelete, canAdmin, isLoading } =
    useModulePermissionFromContext();
  const user = useAuthStore((s) => s.user);

  return useMemo(
    () => ({
      canView: canView || canAdmin,
      canCreate: canCreate || canAdmin,
      canUpdate,
      canDelete,
      canAdmin,
      isLoading,
      canToggleTrangThai: canToggleTrangThaiBaoCaoSoChe(canAdmin),
      canEditRow: (item: FarmBaoCaoSoChe) =>
        canMutateBaoCaoSoChe(item, canUpdate, canAdmin, user?.id),
      canDeleteRow: (item: FarmBaoCaoSoChe) =>
        canMutateBaoCaoSoChe(item, canDelete, canAdmin, user?.id),
      canCopyNextDay: (item: FarmBaoCaoSoChe) =>
        canCopyBaoCaoSoCheToNextDay(item, canCreate, canAdmin, user?.id),
    }),
    [canView, canCreate, canUpdate, canDelete, canAdmin, isLoading, user]
  );
}
