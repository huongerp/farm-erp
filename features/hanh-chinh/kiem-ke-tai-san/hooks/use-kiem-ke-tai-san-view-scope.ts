/**
 * Phạm vi xem Kiểm kê tài sản theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → viewAll: xem tất cả đợt + Thống kê đầy đủ.
 * - Ngược lại → chỉ xem đợt có id_nguoi_phu_trach = user.id; Thống kê tính trên tập đợt đó.
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useRoles } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';

const MODULE_ID = 'hanh-chinh/kiem-ke-tai-san';

export interface KiemKeTaiSanViewScope {
  /** true: xem tất cả đợt. false: chỉ đợt do mình phụ trách (id_nguoi_phu_trach = user.id). */
  viewAll: boolean;
  isLoading: boolean;
}

export function useKiemKeTaiSanViewScope(): KiemKeTaiSanViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  return useMemo(() => {
    const defaultScope: KiemKeTaiSanViewScope = {
      viewAll: false,
      isLoading: rolesLoading,
    };

    if (rolesLoading) return defaultScope;

    const chucVuId = user?.id_chuc_vu ?? null;
    if (!chucVuId) return { viewAll: false, isLoading: false };

    const role = roles.find((r) => String(r.id_chuc_vu) === String(chucVuId));
    const modulePerm = role?.quyen_han?.find((q) => q.module_id === MODULE_ID);
    const actions: ActionType[] = modulePerm?.actions ?? [];
    const has = (key: ActionType) => actions.includes(key);
    const hasAdminOrAll = has('admin') || has('all');
    const thuTuChucVu = role?.thu_tu_chuc_vu ?? 999;

    if (hasAdminOrAll || thuTuChucVu === 1) {
      return { viewAll: true, isLoading: false };
    }

    return { viewAll: false, isLoading: false };
  }, [user?.id_chuc_vu, roles, rolesLoading]);
}
