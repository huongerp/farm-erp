/**
 * Phạm vi xem nhật ký pha phèn theo phân quyền module + chi nhánh nhân viên.
 * Admin / all hoặc cấp bậc 1 → xem tất cả; khác → chỉ chi nhánh được phân.
 */
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { NKPP_MODULE_ID } from '../core/constants';

export function useNhatKyPhaPhenViewScope() {
  return useEmployeeBranchModuleScope(NKPP_MODULE_ID);
}

/** Cấp cao: cấp bậc 1 hoặc quyền admin/all trên module — sửa / xoá nhật ký của mọi NSC. */
export function useNhatKyPhaPhenCapCao(): boolean {
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermissionFromContext();
  return toanQuyen || canAdmin;
}
