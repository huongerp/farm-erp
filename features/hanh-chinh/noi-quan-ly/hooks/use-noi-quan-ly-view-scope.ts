/**
 * Phạm vi xem Nơi quản lý theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → viewAll: xem tất cả nơi lưu + Thống kê.
 * - Ngược lại → chỉ xem nơi lưu thuộc chi nhánh được phân (id_chi_nhanh in allowedBranchIds từ nhân viên).
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useRoles } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';

const MODULE_ID = 'hanh-chinh/noi-quan-ly';

export interface NoiQuanLyViewScope {
  viewAll: boolean;
  allowedBranchIds: string[];
  isLoading: boolean;
}

export function useNoiQuanLyViewScope(): NoiQuanLyViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  return useMemo(() => {
    const defaultScope: NoiQuanLyViewScope = {
      viewAll: true,
      allowedBranchIds: [],
      isLoading: rolesLoading || employeesLoading,
    };

    if (rolesLoading || employeesLoading) return defaultScope;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return { viewAll: false, allowedBranchIds: [], isLoading: false };

    const role = roles.find((r) => String(r.id_chuc_vu) === String(chucVuId));
    const modulePerm = role?.quyen_han?.find((q) => q.module_id === MODULE_ID);
    const actions: ActionType[] = modulePerm?.actions ?? [];
    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');
    const thuTuChucVu = role?.thu_tu_chuc_vu ?? 999;

    if (hasAdminOrAll || thuTuChucVu === 1) {
      return { viewAll: true, allowedBranchIds: [], isLoading: false };
    }

    const currentEmployee = user?.id
      ? employees.find((e) => String(e.id) === String(user.id))
      : null;
    const allowedBranchIds = currentEmployee?.id_chi_nhanh?.length
      ? [...currentEmployee.id_chi_nhanh]
      : [];
    return {
      viewAll: false,
      allowedBranchIds,
      isLoading: false,
    };
  }, [user?.id, user?.id_chuc_vu, roles, employees, rolesLoading, employeesLoading]);
}
