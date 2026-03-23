/**
 * Phạm vi xem đơn đặt hàng theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → xem tất cả.
 * - thu_tu ≠ 1 → chi nhánh (chi_nhanh_ids) qua kho nhận + đơn do chính user đặt.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'mua-hang/don-dat-hang';

export type DonDatHangViewScope = EmployeeBranchModuleScope;

export function useDonDatHangViewScope(): DonDatHangViewScope {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
