/**
 * Phạm vi xem Khấu hao tài sản theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → viewAll: xem tất cả kỳ + Thống kê đầy đủ.
 * - Ngược lại → chỉ xem kỳ do mình tạo (id_nguoi_tao = user.id); Thống kê trên tập kỳ đó.
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useRoles } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';

const MODULE_ID = 'hanh-chinh/khau-hao-tai-san';

export interface KhauHaoTaiSanViewScope {
  /** true: xem tất cả kỳ. false: chỉ kỳ do mình tạo (id_nguoi_tao = user.id). */
  viewAll: boolean;
  isLoading: boolean;
}

export function useKhauHaoTaiSanViewScope(): KhauHaoTaiSanViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  return useMemo(() => {
    const defaultScope: KhauHaoTaiSanViewScope = {
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
