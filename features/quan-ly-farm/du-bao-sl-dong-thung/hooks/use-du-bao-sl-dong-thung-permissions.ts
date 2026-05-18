import { useMemo } from 'react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useAuthStore } from '../../../../store/useStore';
import type { FarmDuBaoSlDongThung } from '../core/types';
import {
  canMutateDuBaoSlDongThung,
  canToggleTrangThaiDuBaoSlDongThung,
} from '../core/permissions';

/** Phân quyền module dự báo SL đóng thùng (xem / thêm / sửa / xóa / quản trị + quy tắc khóa phiếu). */
export function useDuBaoSlDongThungPermissions() {
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
      canToggleTrangThai: canToggleTrangThaiDuBaoSlDongThung(canAdmin),
      canEditRow: (item: FarmDuBaoSlDongThung) =>
        canMutateDuBaoSlDongThung(item, canUpdate, canAdmin, user?.id),
      canDeleteRow: (item: FarmDuBaoSlDongThung) =>
        canMutateDuBaoSlDongThung(item, canDelete, canAdmin, user?.id),
    }),
    [canView, canCreate, canUpdate, canDelete, canAdmin, isLoading, user]
  );
}
