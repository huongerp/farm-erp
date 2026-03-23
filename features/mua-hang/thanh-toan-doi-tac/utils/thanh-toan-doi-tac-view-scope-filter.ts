import type { ThanhToanDoiTac } from '../core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

function isOwnThanhToan(p: ThanhToanDoiTac, employeeId: string | null): boolean {
  return !!(employeeId && String(p.id_nguoi_tao) === employeeId);
}

/** id_don_vi = chi nhánh (alias đơn vị trong UI). */
export function filterThanhToanDoiTacListByViewScope(
  list: ThanhToanDoiTac[],
  scope: Pick<EmployeeBranchModuleScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'currentEmployeeId'>
): ThanhToanDoiTac[] {
  if (scope.viewAll) return list;

  const empId = scope.currentEmployeeId;

  if (!scope.viewByBranch) {
    return empId ? list.filter((p) => isOwnThanhToan(p, empId)) : [];
  }

  const allowedSet = new Set(scope.allowedBranchIds);

  return list.filter((p) => {
    if (isOwnThanhToan(p, empId)) return true;
    if (scope.allowedBranchIds.length === 0) return false;
    return p.id_don_vi != null && allowedSet.has(p.id_don_vi);
  });
}
