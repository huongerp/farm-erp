/**
 * Phạm vi xem thu hoạch theo phân quyền module + chi nhánh nhân viên (cùng quy tắc phiếu kho).
 * Admin / all hoặc thứ tự chức vụ = 1 → xem tất cả.
 * Khác → chỉ bản ghi thuộc chi nhánh được phân (id_chi_nhanh); luôn xem bản ghi do chính user tạo.
 */
import { useMemo } from 'react';
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'quan-ly-farm/thu-hoach';

export interface ThuHoachViewScope extends EmployeeBranchModuleScope {
  /** fp_var_nhan_vien.id — luôn xem bản ghi có id_nguoi_tao khớp */
  ownCreatorId: string | null;
}

export function useThuHoachViewScope(): ThuHoachViewScope {
  const base = useEmployeeBranchModuleScope(MODULE_ID);
  return useMemo(
    (): ThuHoachViewScope => ({
      ...base,
      ownCreatorId: base.viewAll ? null : base.currentEmployeeId,
    }),
    [base]
  );
}
