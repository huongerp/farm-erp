/**
 * Phạm vi xem phiếu kho (theo biến thể Sơ chế / Phân thuốc):
 * - quyền admin/all hoặc chức vụ cấp bậc 1 → xem tất cả;
 * - còn lại → phiếu có kho đi / kho đến thuộc chi nhánh được phân, hoặc phiếu do mình lập.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';
import { khoModuleId } from '../../kho-bien-the/bien-the';

export function usePhieuKhoPTViewScope(): EmployeeBranchModuleScope {
  return useEmployeeBranchModuleScope(khoModuleId(useKhoBienThe(), 'phieu-kho-phan-thuoc'));
}
