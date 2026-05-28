import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';

const MODULE_ID = 'kho-van/phieu-kho';

/**
 * Chỉ quan_tri (admin/all trên module) hoặc nhân viên cap_bac = 1 được chỉnh ngày phiếu kho.
 */
export function useCanEditPhieuKhoNgay(): boolean {
  const user = useAuthStore((s) => s.user);
  const { canAdmin } = useModulePermission(MODULE_ID);
  return useMemo(() => canAdmin || user?.cap_bac === 1, [canAdmin, user?.cap_bac]);
}
