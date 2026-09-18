import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const MODULE_ID = 'quan-ly-nha-so-che/bao-cao-so-che';

export function useBaoCaoSoCheViewScope() {
  return useEmployeeBranchModuleScope(MODULE_ID);
}
