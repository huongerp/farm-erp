import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { laCapBacToanQuyen } from '../../../he-thong/phan-quyen/core/cap-bac-toan-quyen';
import {
  canDuyetThuChiQuy,
  canKhongDuyetThuChiQuy,
  canMutateThuChiQuy,
  canSuaNgayThuChiQuy,
  canTraVeChoDuyetThuChiQuy,
  isThuChiQuyLocked,
} from '../core/trang-thai';
import type { PhieuQuyTrangThai } from '../core/trang-thai';

export interface ThuChiQuyPermissions {
  /** cap_bac = 1 hoặc quyền admin/all trên module — người duy nhất duyệt / không duyệt được. */
  laCapCao: boolean;
  canCreate: boolean;
  /** Chọn / đổi ngày phiếu — chỉ cấp cao. */
  canSuaNgay: boolean;
  isLocked: (item: PhieuQuyTrangThai) => boolean;
  canEditRow: (item: PhieuQuyTrangThai) => boolean;
  canDeleteRow: (item: PhieuQuyTrangThai) => boolean;
  canDuyet: (item: PhieuQuyTrangThai) => boolean;
  canKhongDuyet: (item: PhieuQuyTrangThai) => boolean;
  canTraVe: (item: PhieuQuyTrangThai) => boolean;
}

/**
 * Gom quyền module + cấp bậc của người đăng nhập thành các cổng theo TỪNG phiếu.
 * Luật thuần nằm ở `core/trang-thai.ts` (có test); hook này chỉ nạp ngữ cảnh.
 */
export function useThuChiQuyPermissions(): ThuChiQuyPermissions {
  const user = useAuthStore((s) => s.user);
  const { canCreate, canUpdate, canDelete, canAdmin } = useModulePermissionFromContext();

  return useMemo(() => {
    const laCapCao = canAdmin || laCapBacToanQuyen(user?.cap_bac);
    return {
      laCapCao,
      canCreate,
      canSuaNgay: canSuaNgayThuChiQuy(laCapCao),
      isLocked: isThuChiQuyLocked,
      canEditRow: (item) => canMutateThuChiQuy(item, canUpdate, laCapCao),
      canDeleteRow: (item) => canMutateThuChiQuy(item, canDelete, laCapCao),
      canDuyet: (item) => canDuyetThuChiQuy(item, laCapCao),
      canKhongDuyet: (item) => canKhongDuyetThuChiQuy(item, laCapCao),
      canTraVe: (item) => canTraVeChoDuyetThuChiQuy(item, laCapCao),
    };
  }, [canAdmin, canCreate, canUpdate, canDelete, user?.cap_bac]);
}
