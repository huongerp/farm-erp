/**
 * Phạm vi xem phiếu kho phân thuốc:
 * - quyền admin/all hoặc chức vụ cấp bậc 1 → xem tất cả;
 * - còn lại → phiếu có kho đi / kho đến thuộc chi nhánh được phân, hoặc phiếu do mình lập.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

export const MODULE_ID_PHIEU_KHO_PT = 'quan-ly-nha-so-che/phieu-kho-phan-thuoc';

export function usePhieuKhoPTViewScope(): EmployeeBranchModuleScope {
  return useEmployeeBranchModuleScope(MODULE_ID_PHIEU_KHO_PT);
}
