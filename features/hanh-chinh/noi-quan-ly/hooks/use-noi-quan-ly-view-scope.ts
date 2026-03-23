/**
 * Phạm vi xem Nơi quản lý theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → viewAll.
 * - Ngược lại → nơi lưu thuộc chi nhánh được phân (chi_nhanh_ids).
 */
import { useMemo } from 'react';
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'hanh-chinh/noi-quan-ly';

export interface NoiQuanLyViewScope {
  viewAll: boolean;
  allowedBranchIds: string[];
  isLoading: boolean;
}

export function useNoiQuanLyViewScope(): NoiQuanLyViewScope {
  const s = useEmployeeBranchModuleScope(MODULE_ID);
  return useMemo(
    (): NoiQuanLyViewScope => ({
      viewAll: s.viewAll,
      allowedBranchIds: s.allowedBranchIds,
      isLoading: s.isLoading,
    }),
    [s]
  );
}
