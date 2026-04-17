/**
 * Phạm vi xem Kiểm kê tài sản theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → viewAll: xem tất cả đợt + Thống kê đầy đủ.
 * - Ngược lại → chỉ xem đợt có id_nguoi_phu_trach = user.id; Thống kê tính trên tập đợt đó.
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useCurrentRoleContext } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';

const MODULE_ID = 'hanh-chinh/kiem-ke-tai-san';

export interface KiemKeTaiSanViewScope {
  /** true: xem tất cả đợt. false: chỉ đợt do mình phụ trách (id_nguoi_phu_trach = user.id). */
  viewAll: boolean;
  isLoading: boolean;
}

export function useKiemKeTaiSanViewScope(): KiemKeTaiSanViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: ctx, isPending: ctxPending } = useCurrentRoleContext();

  return useMemo(() => {
    const defaultScope: KiemKeTaiSanViewScope = {
      viewAll: false,
      isLoading: ctxPending,
    };

    if (ctxPending) return defaultScope;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return { viewAll: false, isLoading: false };

    const quyenHan = ctx?.quyenHan ?? [];
    const modulePerm = quyenHan.find((q) => q.module_id === MODULE_ID);
    const actions: ActionType[] = modulePerm?.actions ?? [];
    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');
    const thuTuChucVu = ctx?.thuTuChucVu ?? 999;

    if (hasAdminOrAll || thuTuChucVu === 1) {
      return { viewAll: true, isLoading: false };
    }

    return { viewAll: false, isLoading: false };
  }, [user?.id_chuc_vu, ctx, ctxPending]);
}
