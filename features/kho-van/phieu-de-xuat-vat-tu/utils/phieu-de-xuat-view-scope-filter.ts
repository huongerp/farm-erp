import type { Kho } from '../../danh-sach-kho/core/types';
import type { PhieuDeXuatVatTu } from '../core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

function isOwnDeXuat(p: PhieuDeXuatVatTu, employeeId: string | null): boolean {
  return !!(employeeId && String(p.id_nguoi_de_xuat) === employeeId);
}

export function filterPhieuDeXuatListByViewScope(
  list: PhieuDeXuatVatTu[],
  khoList: Kho[],
  scope: Pick<EmployeeBranchModuleScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'currentEmployeeId'>
): PhieuDeXuatVatTu[] {
  if (scope.viewAll) return list;

  const empId = scope.currentEmployeeId;

  if (!scope.viewByBranch) {
    return empId ? list.filter((p) => isOwnDeXuat(p, empId)) : [];
  }

  const khoIdToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) khoIdToBranchId.set(k.id, k.id_chi_nhanh);
  });
  const allowedSet = new Set(scope.allowedBranchIds);

  return list.filter((p) => {
    if (isOwnDeXuat(p, empId)) return true;
    if (scope.allowedBranchIds.length === 0) return false;
    const branchId = khoIdToBranchId.get(p.id_noi_de_xuat);
    return branchId != null && allowedSet.has(branchId);
  });
}
