/**
 * Phạm vi xem tồn kho theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → xem tất cả (viewAll).
 * - thu_tu chức vụ ≠ 1 → chỉ xem tồn thuộc các chi nhánh được phân (chi_nhanh_ids).
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'kho-van/ton-kho';

export type TonKhoViewScope = EmployeeBranchModuleScope;

export function useTonKhoViewScope(): TonKhoViewScope {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
