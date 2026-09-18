import { useMemo } from 'react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useAuthStore } from '../../../../store/useStore';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  canCopyBaoCaoNhanCongToNextDay,
  canMutateBaoCaoNhanCong,
  canToggleTrangThaiBaoCaoNhanCong,
} from '../core/permissions';

/** Phân quyền module báo cáo nhân công (xem / thêm / sửa / xóa / quản trị + quy tắc khóa phiếu). */
export function useBaoCaoNhanCongPermissions() {
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
      canToggleTrangThai: canToggleTrangThaiBaoCaoNhanCong(canAdmin),
      canEditRow: (item: FarmBaoCaoNhanCong) =>
        canMutateBaoCaoNhanCong(item, canUpdate, canAdmin, user?.id),
      canDeleteRow: (item: FarmBaoCaoNhanCong) =>
        canMutateBaoCaoNhanCong(item, canDelete, canAdmin, user?.id),
      canCopyNextDay: () => canCopyBaoCaoNhanCongToNextDay(canCreate || canAdmin),
      canMutate: (item: FarmBaoCaoNhanCong, action: 'update' | 'delete') =>
        canMutateBaoCaoNhanCong(
          item,
          action === 'update' ? canUpdate : canDelete,
          canAdmin,
          user?.id
        ),
    }),
    [canView, canCreate, canUpdate, canDelete, canAdmin, isLoading, user]
  );
}
