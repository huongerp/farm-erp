/**
 * Phạm vi xem theo chi nhánh + nhân viên hiện tại (dùng chung nhiều module).
 * Chi nhánh lấy từ fp_var_nhan_vien.chi_nhanh_ids → Employee.id_chi_nhanh (đã chuẩn hoá trong nhan-vien-service).
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useRoles } from '../../phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../phan-quyen/core/types';
import { useEmployees } from './use-nhan-vien';

export interface EmployeeBranchModuleScope {
  viewAll: boolean;
  viewByBranch: boolean;
  allowedBranchIds: string[];
  /** fp_var_nhan_vien.id — lọc bản ghi "của tôi" */
  currentEmployeeId: string | null;
  isLoading: boolean;
}

export function useEmployeeBranchModuleScope(moduleId: string): EmployeeBranchModuleScope {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  return useMemo(() => {
    const ownId = user?.id ? String(user.id) : null;

    const loadingScope: EmployeeBranchModuleScope = {
      viewAll: true,
      viewByBranch: false,
      allowedBranchIds: [],
      currentEmployeeId: ownId,
      isLoading: true,
    };

    if (rolesLoading || employeesLoading) return loadingScope;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) {
      return {
        viewAll: false,
        viewByBranch: true,
        allowedBranchIds: [],
        currentEmployeeId: ownId,
        isLoading: false,
      };
    }

    const role = roles.find((r) => String(r.id_chuc_vu) === String(chucVuId));
    const modulePerm = role?.quyen_han?.find((q) => q.module_id === moduleId);
    const actions: ActionType[] = modulePerm?.actions ?? [];
    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');
    const thuTuChucVu = role?.thu_tu_chuc_vu ?? 999;

    if (hasAdminOrAll || thuTuChucVu === 1) {
      return {
        viewAll: true,
        viewByBranch: false,
        allowedBranchIds: [],
        currentEmployeeId: ownId,
        isLoading: false,
      };
    }

    const currentEmployee = user?.id
      ? employees.find((e) => String(e.id) === String(user.id))
      : null;
    const allowedBranchIds = currentEmployee?.id_chi_nhanh?.length
      ? [...currentEmployee.id_chi_nhanh]
      : [];
    return {
      viewAll: false,
      viewByBranch: true,
      allowedBranchIds,
      currentEmployeeId: ownId,
      isLoading: false,
    };
  }, [moduleId, user?.id, user?.id_chuc_vu, roles, employees, rolesLoading, employeesLoading]);
}
