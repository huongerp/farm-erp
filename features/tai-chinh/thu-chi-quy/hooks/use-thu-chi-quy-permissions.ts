import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { laCapBacToanQuyen } from '../../../he-thong/phan-quyen/core/cap-bac-toan-quyen';
import {
  canDuyetMoThuChiQuy,
  canKhoaThuChiQuy,
  canMutateThuChiQuy,
  canTuChoiMoThuChiQuy,
  canXinMoThuChiQuy,
  isThuChiQuyLocked,
} from '../core/trang-thai';
import type { PhieuQuyTrangThai } from '../core/trang-thai';

export interface ThuChiQuyPermissions {
  /** cap_bac = 1 hoặc quyền admin/all trên module — người duy nhất mở khoá được. */
  laCapCao: boolean;
  canCreate: boolean;
  isLocked: (item: PhieuQuyTrangThai) => boolean;
  canEditRow: (item: PhieuQuyTrangThai) => boolean;
  canDeleteRow: (item: PhieuQuyTrangThai) => boolean;
  canKhoa: (item: PhieuQuyTrangThai) => boolean;
  canXinMo: (item: PhieuQuyTrangThai) => boolean;
  canDuyetMo: (item: PhieuQuyTrangThai) => boolean;
  canTuChoiMo: (item: PhieuQuyTrangThai) => boolean;
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
    const userId = user?.id ?? null;
    return {
      laCapCao,
      canCreate,
      isLocked: isThuChiQuyLocked,
      canEditRow: (item) => canMutateThuChiQuy(item, canUpdate, laCapCao),
      canDeleteRow: (item) => canMutateThuChiQuy(item, canDelete, laCapCao),
      canKhoa: (item) => canKhoaThuChiQuy(item, laCapCao, userId),
      canXinMo: (item) => canXinMoThuChiQuy(item, laCapCao, userId),
      canDuyetMo: (item) => canDuyetMoThuChiQuy(item, laCapCao),
      canTuChoiMo: (item) => canTuChoiMoThuChiQuy(item, laCapCao),
    };
  }, [canAdmin, canCreate, canUpdate, canDelete, user?.cap_bac, user?.id]);
}
