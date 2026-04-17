/**
 * Phạm vi xem Bảo trì sửa chữa (Chi phí tài sản) theo phân quyền:
 * - quan_tri (admin/all) hoặc thu_tu chức vụ = 1 → viewAll: xem tất cả phiếu + Thống kê đầy đủ.
 * - Ngược lại → chỉ xem phiếu "của tôi": id_nguoi_tao = user.id hoặc phiếu thuộc tài sản đang do user giữ (id_nhan_vien_dang_giu = user.id).
 */
import { useMemo } from 'react';
import { useAuthStore } from '../../../../store/useStore';
import { useCurrentRoleContext } from '../../../he-thong/phan-quyen/hooks/use-phan-quyen';
import type { ActionType } from '../../../he-thong/phan-quyen/core/types';

const MODULE_ID = 'hanh-chinh/chi-phi-tai-san';

export interface BaoTriSuaChuaViewScope {
  /** true: xem tất cả phiếu. false: chỉ phiếu do mình tạo hoặc tài sản mình đang giữ. */
  viewAll: boolean;
  isLoading: boolean;
}

export function useBaoTriSuaChuaViewScope(): BaoTriSuaChuaViewScope {
  const user = useAuthStore((s) => s.user);
  const { data: ctx, isPending: ctxPending } = useCurrentRoleContext();

  return useMemo(() => {
    const defaultScope: BaoTriSuaChuaViewScope = {
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
