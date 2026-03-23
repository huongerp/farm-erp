import type { Kho } from '../../danh-sach-kho/core/types';
import type { DotKiemKeKho } from '../core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

function isOwnDot(dot: DotKiemKeKho, employeeId: string | null): boolean {
  return !!(employeeId && String(dot.id_nguoi_phu_trach) === employeeId);
}

function dotTouchesAllowedBranch(
  dot: DotKiemKeKho,
  khoIdToBranchId: Map<string, string>,
  allowedSet: Set<string>
): boolean {
  return dot.id_kho.some((kid) => {
    const b = khoIdToBranchId.get(kid);
    return b != null && allowedSet.has(b);
  });
}

export function filterDotKiemKeListByViewScope(
  list: DotKiemKeKho[],
  khoList: Kho[],
  scope: Pick<EmployeeBranchModuleScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'currentEmployeeId'>
): DotKiemKeKho[] {
  if (scope.viewAll) return list;

  const empId = scope.currentEmployeeId;

  if (!scope.viewByBranch) {
    return empId ? list.filter((d) => isOwnDot(d, empId)) : [];
  }

  const khoIdToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) khoIdToBranchId.set(k.id, k.id_chi_nhanh);
  });
  const allowedSet = new Set(scope.allowedBranchIds);

  return list.filter((d) => {
    if (isOwnDot(d, empId)) return true;
    if (scope.allowedBranchIds.length === 0) return false;
    return dotTouchesAllowedBranch(d, khoIdToBranchId, allowedSet);
  });
}
