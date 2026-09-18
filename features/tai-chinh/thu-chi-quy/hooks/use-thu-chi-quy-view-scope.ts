import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

export const THU_CHI_QUY_MODULE_ID = 'tai-chinh/thu-chi-quy';

/**
 * Phạm vi xem sổ quỹ: farm nào xem farm đó (chi_nhanh_ids của nhân viên);
 * cap_bac = 1 hoặc quyền admin/all trên module → xem mọi chi nhánh.
 */
export function useThuChiQuyViewScope(): EmployeeBranchModuleScope {
  return useEmployeeBranchModuleScope(THU_CHI_QUY_MODULE_ID);
}
