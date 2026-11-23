import { useMemo } from 'react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  canCopyBaoCaoNhanCongToNextDay,
  canMutateBaoCaoNhanCong,
  canToggleTrangThaiBaoCaoNhanCong,
  coQuyenThemNhanVien,
  coQuyenThemViTri,
} from '../core/permissions';
import { useAuthStore } from '../../../../store/useStore';

/** Phân quyền module báo cáo nhân công (xem / thêm / sửa / xóa / quản trị + quy tắc khóa phiếu). */
export function useBaoCaoNhanCongPermissions() {
  const { canView, canCreate, canUpdate, canDelete, canApprove, canAdmin, isLoading } =
    useModulePermissionFromContext();
  const isSuperAdmin = useAuthStore((s) => s.user?.is_super_admin);

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
      /** Thêm vị trí công việc mới vào danh mục dùng chung — chỉ tài khoản super admin. */
      canThemViTri: coQuyenThemViTri({ isSuperAdmin }),
      /** Thêm tên nhân viên mới vào danh mục nhân viên sơ chế — chỉ tài khoản super admin. */
      canThemNhanVien: coQuyenThemNhanVien({ isSuperAdmin }),
      /** Chốt thưởng vượt tháng — khớp rpc_bcnc_chot_thang (approve/admin/all, migration 089). */
      canChotThuongThang: canApprove || canAdmin,
      /** Mở chốt — khớp rpc_bcnc_mo_chot_thang (admin/all). */
      canMoChotThuongThang: canAdmin,
      canMutate: (item: FarmBaoCaoNhanCong, action: 'update' | 'delete') =>
        canMutateBaoCaoNhanCong(
          item,
          action === 'update' ? canUpdate : canDelete,
          canAdmin
        ),
    }),
    [canView, canCreate, canUpdate, canDelete, canApprove, canAdmin, isLoading, isSuperAdmin]
  );
}
