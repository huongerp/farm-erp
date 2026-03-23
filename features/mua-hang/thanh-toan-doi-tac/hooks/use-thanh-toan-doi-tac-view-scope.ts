/**
 * Phạm vi xem thanh toán đối tác theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → xem tất cả.
 * - thu_tu ≠ 1 → theo chi nhánh (id_don_vi) + bản ghi do chính user tạo.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'mua-hang/thanh-toan-doi-tac';

export type ThanhToanDoiTacViewScope = EmployeeBranchModuleScope;

export function useThanhToanDoiTacViewScope(): ThanhToanDoiTacViewScope {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
