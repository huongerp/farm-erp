/**
 * Phạm vi xem đơn đặt hàng theo phân quyền:
 * - cấp bậc 1 hoặc quyền admin/all trên module → xem tất cả.
 * - còn lại (vd chỉ có quyền Xem) → đơn có kho nhận thuộc farm của mình (chi_nhanh_ids) + đơn do chính mình đặt.
 */
import { useMemo } from 'react';
import {
  useEmployeeBranchModuleScope,
  type EmployeeBranchModuleScope,
} from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { buildEmployeeBranchScopeForServer, type BranchListScope } from '../../../../lib/branch-scope-query';

const MODULE_ID = 'mua-hang/don-dat-hang';

export type DonDatHangViewScope = EmployeeBranchModuleScope;

export function useDonDatHangViewScope(): DonDatHangViewScope {
  return useEmployeeBranchModuleScope(MODULE_ID);
}

/**
 * Phạm vi dạng lọc server (id kho được phép). `isLoading` = còn chờ quyền hoặc danh sách kho —
 * truy vấn đơn phải đợi hết (enabled: !isLoading) để không chớp ra đơn của farm khác.
 */
export function useDonDatHangServerScope(): { scope: BranchListScope; isLoading: boolean } {
  const viewScope = useDonDatHangViewScope();
  const { data: khoList = [], isPending: khoPending } = useKhoList();
  return useMemo(
    () => ({
      scope: buildEmployeeBranchScopeForServer(
        viewScope.viewAll,
        viewScope.viewByBranch,
        viewScope.allowedBranchIds,
        viewScope.currentEmployeeId,
        khoList
      ),
      isLoading: viewScope.isLoading || (!viewScope.viewAll && khoPending),
    }),
    [viewScope, khoList, khoPending]
  );
}
