/**
 * Phạm vi xem nhật ký pha thuốc phun cùi theo phân quyền module + chi nhánh nhân viên.
 * Admin / all hoặc cấp bậc 1 → xem tất cả NSC; khác → chỉ NSC được phân.
 */
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { NKPC_MODULE_ID } from '../core/constants';

export function useNhatKyPhunCuiViewScope() {
  return useEmployeeBranchModuleScope(NKPC_MODULE_ID);
}

/** Cấp cao: cấp bậc 1 hoặc quyền admin/all trên module. */
export function useNhatKyPhunCuiCapCao(): boolean {
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermissionFromContext();
  return toanQuyen || canAdmin;
}
