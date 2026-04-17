/**
 * Phạm vi xem theo chi nhánh + nhân viên hiện tại (dùng chung nhiều module).
 * Chi nhánh lấy từ fp_var_nhan_vien.chi_nhanh_ids → Employee.id_chi_nhanh (đã chuẩn hoá trong nhan-vien-service).
 * Chỉ tải một nhân viên (user hiện tại) — không gọi danh sách toàn bộ nhân viên (giảm egress).
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useCurrentRoleContext } from '../../phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../phan-quyen/core/types';
import { useEmployee } from './use-nhan-vien';

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
  const { data: ctx, isPending: ctxPending } = useCurrentRoleContext();
  const uid = user?.id ? String(user.id) : null;
  const { data: me, isPending: mePending } = useEmployee(uid);

  return useMemo(() => {
    const ownId = uid;

    const loadingScope: EmployeeBranchModuleScope = {
      viewAll: true,
      viewByBranch: false,
      allowedBranchIds: [],
      currentEmployeeId: ownId,
      isLoading: true,
    };

    if (ctxPending) return loadingScope;

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

    const quyenHan = ctx?.quyenHan ?? [];
    const modulePerm = quyenHan.find((q) => q.module_id === moduleId);
    const actions: ActionType[] = modulePerm?.actions ?? [];
    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');
    const thuTuChucVu = ctx?.thuTuChucVu ?? 999;

    if (hasAdminOrAll || thuTuChucVu === 1) {
      return {
        viewAll: true,
        viewByBranch: false,
        allowedBranchIds: [],
        currentEmployeeId: ownId,
        isLoading: false,
      };
    }

    if (mePending) return loadingScope;

    const allowedBranchIds = me?.id_chi_nhanh?.length ? [...me.id_chi_nhanh] : [];
    return {
      viewAll: false,
      viewByBranch: true,
      allowedBranchIds,
      currentEmployeeId: ownId,
      isLoading: false,
    };
  }, [moduleId, user?.id_chuc_vu, ctx, ctxPending, me, mePending, uid]);
}
