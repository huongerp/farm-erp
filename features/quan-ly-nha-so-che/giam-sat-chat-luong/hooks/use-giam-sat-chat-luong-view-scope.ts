/**
 * Phạm vi xem giám sát chất lượng theo phân quyền module + farm (chi nhánh) của nhân viên.
 * Admin / all hoặc cấp bậc 1 → xem tất cả; khác → chỉ farm được phân.
 */
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

export const GSCL_MODULE_ID = 'quan-ly-nha-so-che/giam-sat-chat-luong';

export function useGiamSatChatLuongViewScope() {
  return useEmployeeBranchModuleScope(GSCL_MODULE_ID);
}

/** Cấp cao: cấp bậc 1 hoặc quyền admin/all — sửa phiếu đã xong, cấu hình tiêu chí. */
export function useGiamSatChatLuongCapCao(): boolean {
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermissionFromContext();
  return toanQuyen || canAdmin;
}
