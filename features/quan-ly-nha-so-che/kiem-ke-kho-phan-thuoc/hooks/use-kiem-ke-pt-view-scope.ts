/**
 * Phạm vi xem kiểm kê kho phân thuốc:
 * - quyền admin/all hoặc chức vụ cấp bậc 1 → xem tất cả;
 * - còn lại → đợt chạm kho thuộc chi nhánh được phân, hoặc đợt do mình tạo / phụ trách.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

export const MODULE_ID_KIEM_KE_PT = 'quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc';

export type KiemKeKhoPTViewScope = EmployeeBranchModuleScope;

export function useKiemKeKhoPTViewScope(): KiemKeKhoPTViewScope {
  return useEmployeeBranchModuleScope(MODULE_ID_KIEM_KE_PT);
}
