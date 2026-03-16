/**
 * Phạm vi xem đơn đặt hàng theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → xem tất cả (viewAll).
 * - thu_tu chức vụ ≠ 1 → chỉ xem đơn thuộc các chi nhánh được phân (chi_nhanh_ids của nhân viên).
 * Đơn đặt hàng: lọc theo id_kho_nhan → kho.id_chi_nhanh.
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useRoles } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';

const MODULE_ID = 'mua-hang/don-dat-hang';

export interface DonDatHangViewScope {
  viewAll: boolean;
  viewByBranch: boolean;
  allowedBranchIds: string[];
  isLoading: boolean;
}

export function useDonDatHangViewScope(): DonDatHangViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  return useMemo(() => {
    const defaultScope: DonDatHangViewScope = {
      viewAll: true,
      viewByBranch: false,
      allowedBranchIds: [],
      isLoading: rolesLoading || employeesLoading,
    };

    if (rolesLoading || employeesLoading) return defaultScope;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return { ...defaultScope, viewAll: false };

    const role = roles.find((r) => String(r.id_chuc_vu) === String(chucVuId));
    const modulePerm = role?.quyen_han?.find((q) => q.module_id === MODULE_ID);
    const actions: ActionType[] = modulePerm?.actions ?? [];
    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');
    const thuTuChucVu = role?.thu_tu_chuc_vu ?? 999;

    if (hasAdminOrAll || thuTuChucVu === 1) {
      return { viewAll: true, viewByBranch: false, allowedBranchIds: [], isLoading: false };
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
      isLoading: false,
    };
  }, [user?.id, user?.id_chuc_vu, roles, employees, rolesLoading, employeesLoading]);
}
