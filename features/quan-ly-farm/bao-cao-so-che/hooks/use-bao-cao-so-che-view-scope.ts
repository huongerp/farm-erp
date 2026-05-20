import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'quan-ly-farm/bao-cao-so-che';

export function useBaoCaoSoCheViewScope() {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
