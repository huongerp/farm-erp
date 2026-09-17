/**
 * Phạm vi xem Thiết lập tài sản theo phân quyền:
 * - quan_tri (admin/all) hoặc nhân viên cấp bậc 1 → viewAll: xem và sửa đủ 3 tab (Nhóm, Trạng thái, Loại chi phí).
 * - Ngược lại → !viewAll: ẩn toàn bộ nội dung, chỉ hiển thị thông báo không có quyền xem.
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useCurrentRoleContext } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';

const MODULE_ID = 'hanh-chinh/thiet-lap-tai-san';

export interface ThietLapTaiSanViewScope {
  /** true: được xem nội dung thiết lập. false: chỉ hiển thị thông báo không có quyền. */
  viewAll: boolean;
  isLoading: boolean;
}

export function useThietLapTaiSanViewScope(): ThietLapTaiSanViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: ctx, isPending: ctxPending } = useCurrentRoleContext();
  const toanQuyen = useCapBacToanQuyen();

  return useMemo(() => {
    const defaultScope: ThietLapTaiSanViewScope = {
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
