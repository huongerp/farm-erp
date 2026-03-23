import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { DonDatHang } from '../core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

function isOwnDon(p: DonDatHang, employeeId: string | null): boolean {
  return !!(employeeId && String(p.id_nguoi_dat) === employeeId);
}

export function filterDonDatHangListByViewScope(
  list: DonDatHang[],
  khoList: Kho[],
  scope: Pick<EmployeeBranchModuleScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'currentEmployeeId'>
): DonDatHang[] {
  if (scope.viewAll) return list;

  const empId = scope.currentEmployeeId;

  if (!scope.viewByBranch) {
    return empId ? list.filter((p) => isOwnDon(p, empId)) : [];
  }

  const khoIdToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) khoIdToBranchId.set(k.id, k.id_chi_nhanh);
  });
  const allowedSet = new Set(scope.allowedBranchIds);

  return list.filter((p) => {
    if (isOwnDon(p, empId)) return true;
    if (scope.allowedBranchIds.length === 0) return false;
    const kid = p.id_kho_nhan;
    if (!kid) return false;
    const branchId = khoIdToBranchId.get(kid);
    return branchId != null && allowedSet.has(branchId);
  });
}
