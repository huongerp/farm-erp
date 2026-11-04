import { useMemo } from 'react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  canCopyBaoCaoNhanCongToNextDay,
  canMutateBaoCaoNhanCong,
  canToggleTrangThaiBaoCaoNhanCong,
  coQuyenThemViTri,
} from '../core/permissions';
import { useAuthStore } from '../../../../store/useStore';

/** Phân quyền module báo cáo nhân công (xem / thêm / sửa / xóa / quản trị + quy tắc khóa phiếu). */
export function useBaoCaoNhanCongPermissions() {
  const { canView, canCreate, canUpdate, canDelete, canAdmin, isLoading } =
    useModulePermissionFromContext();
  const capBac = useAuthStore((s) => s.user?.cap_bac);

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
        canMutateBaoCaoNhanCong(item, canUpdate, canAdmin),
      canDeleteRow: (item: FarmBaoCaoNhanCong) =>
        canMutateBaoCaoNhanCong(item, canDelete, canAdmin),
      canCopyNextDay: () => canCopyBaoCaoNhanCongToNextDay(canCreate || canAdmin),
      /** Thêm vị trí công việc mới vào danh mục dùng chung — chỉ cấp cao. */
      canThemViTri: coQuyenThemViTri({ canAdmin, capBac }),
      canMutate: (item: FarmBaoCaoNhanCong, action: 'update' | 'delete') =>
        canMutateBaoCaoNhanCong(
          item,
          action === 'update' ? canUpdate : canDelete,
          canAdmin
        ),
    }),
    [canView, canCreate, canUpdate, canDelete, canAdmin, isLoading, capBac]
  );
}
