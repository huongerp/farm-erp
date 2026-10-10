/**
 * Phạm vi xem đăng ký tham quan theo phân quyền module + chi nhánh nhân viên.
 * Admin / all hoặc cấp bậc 1 → xem tất cả; khác → chỉ chi nhánh được phân.
 */
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

export const DKTQ_MODULE_ID = 'quan-ly-nha-so-che/dang-ky-tham-quan';

export function useDangKyThamQuanViewScope() {
  return useEmployeeBranchModuleScope(DKTQ_MODULE_ID);
}

/** Cấp cao: cấp bậc 1 hoặc quyền admin/all trên module — hoàn tác, sửa phiếu đã xong. */
export function useDangKyThamQuanCapCao(): boolean {
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermissionFromContext();
  return toanQuyen || canAdmin;
}
