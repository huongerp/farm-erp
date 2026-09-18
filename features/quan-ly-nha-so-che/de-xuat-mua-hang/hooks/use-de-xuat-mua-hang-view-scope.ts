/**
 * Phạm vi xem phiếu đề xuất vật tư theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → xem tất cả.
 * - thu_tu ≠ 1 → chi nhánh (chi_nhanh_ids) qua kho nơi đề xuất + phiếu do chính user đề xuất.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'mua-hang/de-xuat-mua-hang';

export type DeXuatMuaHangViewScope = EmployeeBranchModuleScope;

export function useDeXuatMuaHangViewScope(): DeXuatMuaHangViewScope {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
