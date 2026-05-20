import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'quan-ly-farm/du-bao-sl-dong-thung';

export function useDuBaoSlDongThungViewScope() {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
