/**
 * Phạm vi xem phiếu kho theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → xem tất cả (viewAll).
 * - thu_tu chức vụ ≠ 1 → chỉ xem phiếu thuộc các chi nhánh được phân (chi_nhanh_ids của nhân viên).
 * Phiếu kho: lọc theo kho_id và kho_den_id. Nhập/xuất: theo kho_id. Chuyển kho: kho_id hoặc kho_den_id (OR).
 * Luôn xem được phiếu do chính user tạo (nguoi_tao_id = fp_var_nhan_vien.id).
 */
import { useMemo } from 'react';
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'kho-van/phieu-kho';

export interface PhieuKhoViewScope extends EmployeeBranchModuleScope {
  /** Khi không viewAll: id nhân viên để luôn xem phiếu do họ tạo (= currentEmployeeId) */
  ownPhieuCreatorId: string | null;
}

export function usePhieuKhoViewScope(): PhieuKhoViewScope {
  const base = useEmployeeBranchModuleScope(MODULE_ID);
  return useMemo(
    (): PhieuKhoViewScope => ({
      ...base,
      ownPhieuCreatorId: base.viewAll ? null : base.currentEmployeeId,
    }),
    [base]
  );
}
