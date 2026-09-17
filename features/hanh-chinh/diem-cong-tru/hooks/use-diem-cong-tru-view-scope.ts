/**
 * Phạm vi xem Điểm cộng trừ theo phân quyền:
 * - quan_tri (admin/all) hoặc nhân viên cấp bậc 1 → viewAll: xem toàn bộ dữ liệu.
 * - Ngược lại → chỉ xem bản ghi của chính mình (id_nhan_vien = user.id).
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useCurrentRoleContext } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';

const MODULE_ID = 'hanh-chinh/diem-cong-tru';

export interface DiemCongTruViewScope {
  /** true: xem tất cả bản ghi. false: chỉ xem bản ghi của chính mình (id_nhan_vien = user.id). */
  viewAll: boolean;
  isLoading: boolean;
}

export function useDiemCongTruViewScope(): DiemCongTruViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: ctx, isPending: ctxPending } = useCurrentRoleContext();
  const toanQuyen = useCapBacToanQuyen();

  return useMemo(() => {
    const defaultScope: DiemCongTruViewScope = {
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
