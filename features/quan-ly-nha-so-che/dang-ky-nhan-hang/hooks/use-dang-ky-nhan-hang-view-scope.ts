/**
 * Phạm vi xem đăng ký nhận hàng theo phân quyền module + chi nhánh nhân viên.
 * Admin / all hoặc cấp bậc 1 → xem tất cả; khác → chỉ chi nhánh được phân.
 */
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

export const DKNH_MODULE_ID = 'quan-ly-nha-so-che/dang-ky-nhan-hang';

export function useDangKyNhanHangViewScope() {
  return useEmployeeBranchModuleScope(DKNH_MODULE_ID);
}

/** Cấp cao: cấp bậc 1 hoặc quyền admin/all trên module — hoàn tác, sửa phiếu đã xong. */
export function useDangKyNhanHangCapCao(): boolean {
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermissionFromContext();
  return toanQuyen || canAdmin;
}
