/**
 * Phạm vi xem phiếu đề xuất mua hàng theo phân quyền:
 * - quan_tri (admin/all) hoặc cấp bậc 1 → xem tất cả.
 * - còn lại → chi nhánh (chi_nhanh_ids) qua kho nơi đề xuất + phiếu do chính user đề xuất.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';
import { khoModuleId } from '../../kho-bien-the/bien-the';

export type DeXuatMuaHangViewScope = EmployeeBranchModuleScope;

export function useDeXuatMuaHangViewScope(): DeXuatMuaHangViewScope {
  return useEmployeeBranchModuleScope(khoModuleId(useKhoBienThe(), 'de-xuat-mua-hang'));
}
