/**
 * Phạm vi xem Danh sách tài sản theo phân quyền:
 * - quan_tri (admin/all) hoặc nhân viên cấp bậc 1 → viewAll: hiển thị đủ tab Danh sách + Của tôi + Thống kê.
 * - Ngược lại → chỉ hiển thị tab "Của tôi" và "Thống kê", ẩn tab "Danh sách".
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useCurrentRoleContext } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';

const MODULE_ID = 'hanh-chinh/danh-sach-tai-san';

export interface DanhSachTaiSanViewScope {
  /** true: được xem tab Danh sách (quan_tri hoặc cấp bậc 1). false: chỉ xem Của tôi + Thống kê. */
  viewAll: boolean;
  isLoading: boolean;
}

export function useDanhSachTaiSanViewScope(): DanhSachTaiSanViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: ctx, isPending: ctxPending } = useCurrentRoleContext();
  const toanQuyen = useCapBacToanQuyen();

  return useMemo(() => {
    const defaultScope: DanhSachTaiSanViewScope = {
      viewAll: false,
      isLoading: ctxPending,
    };

    // Cấp bậc 1 → toàn quyền, không chờ phân quyền.
    if (toanQuyen) return { viewAll: true, isLoading: false };

    if (ctxPending) return defaultScope;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return { viewAll: false, isLoading: false };

    const quyenHan = ctx?.quyenHan ?? [];
    const modulePerm = quyenHan.find((q) => q.module_id === MODULE_ID);
    const actions: ActionType[] = modulePerm?.actions ?? [];
    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');

    if (hasAdminOrAll) {
      return { viewAll: true, isLoading: false };
    }

    return { viewAll: false, isLoading: false };
  }, [user?.id_chuc_vu, ctx, ctxPending, toanQuyen]);
}
