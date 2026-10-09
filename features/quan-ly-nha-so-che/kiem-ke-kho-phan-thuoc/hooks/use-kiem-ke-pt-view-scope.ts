/**
 * Phạm vi xem kiểm kê kho (theo biến thể Sơ chế / Phân thuốc):
 * - quyền admin/all hoặc chức vụ cấp bậc 1 → xem tất cả;
 * - còn lại → đợt chạm kho thuộc chi nhánh được phân, hoặc đợt do mình tạo / phụ trách.
 */
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';
import { khoModuleId } from '../../kho-bien-the/bien-the';

export type KiemKeKhoPTViewScope = EmployeeBranchModuleScope;

export function useKiemKeKhoPTViewScope(): KiemKeKhoPTViewScope {
  return useEmployeeBranchModuleScope(khoModuleId(useKhoBienThe(), 'kiem-ke-kho-phan-thuoc'));
}
