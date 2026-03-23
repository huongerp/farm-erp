/**
 * Phạm vi xem kiểm kê kho theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → xem tất cả.
 * - thu_tu ≠ 1 → đợt có kho thuộc chi nhánh được phân (chi_nhanh_ids) hoặc do user phụ trách.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'kho-van/kiem-ke-kho';

export type KiemKeKhoViewScope = EmployeeBranchModuleScope;

export function useKiemKeKhoViewScope(): KiemKeKhoViewScope {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
