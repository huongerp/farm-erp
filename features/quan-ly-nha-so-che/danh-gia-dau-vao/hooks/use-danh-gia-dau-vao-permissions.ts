import { useMemo } from 'react';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useAuthStore } from '../../../../store/useStore';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import type { FarmDgdv } from '../core/types';
import { DGDV_MODULE_ID } from '../core/types';
import {
  coTheCaiDat,
  coTheDoiTrangThai,
  coTheNhapLuoi,
  coTheSuaPhieu,
  coTheXoaPhieu,
  type DgdvQuyenModule,
} from '../core/permissions';

/** Phạm vi xem theo chi nhánh được phân (cấp cao / admin → tất cả). */
export function useDgdvViewScope() {
  return useEmployeeBranchModuleScope(DGDV_MODULE_ID);
}

/** Quyền module Đánh giá đầu vào: thêm / sửa / xoá / khoá phiếu, nhập lưới, Cài đặt danh mục. */
export function useDgdvPermissions() {
  const { canView, canCreate, canUpdate, canDelete, canAdmin, isLoading } = useModulePermissionFromContext();
  const capBacToanQuyen = useCapBacToanQuyen();
  const userId = useAuthStore((s) => s.user?.id);

  return useMemo(() => {
    const q: DgdvQuyenModule = { canCreate: canCreate || canAdmin, canUpdate, canDelete, canAdmin };
    return {
      canView: canView || canAdmin,
      canCreate: q.canCreate,
      canDelete: canDelete || canAdmin,
      canAdmin,
      isLoading,
      canToggleTrangThai: coTheDoiTrangThai(q),
      canCaiDat: coTheCaiDat(q, capBacToanQuyen),
      canEditRow: (p: Pick<FarmDgdv, 'trang_thai' | 'id_nguoi_tao'>) => coTheSuaPhieu(p, q),
      canDeleteRow: (p: Pick<FarmDgdv, 'trang_thai' | 'id_nguoi_tao'>) => coTheXoaPhieu(p, q, userId),
      canNhapLuoi: (p: Pick<FarmDgdv, 'trang_thai'>) => coTheNhapLuoi(p, q),
    };
  }, [canView, canCreate, canUpdate, canDelete, canAdmin, isLoading, capBacToanQuyen, userId]);
}
