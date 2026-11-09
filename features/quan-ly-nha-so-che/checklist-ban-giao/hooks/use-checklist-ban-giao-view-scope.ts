/**
 * Phiếu checklist công đoạn KHÔNG giới hạn theo chi nhánh (RLS = fn_co_quyen_module module, view
 * → ai có quyền xem module cũng thấy toàn bộ phiếu). Cấp cao chỉ cần cấp bậc 1 / admin|all.
 */
import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

export const CHECKLIST_BAN_GIAO_MODULE_ID = 'quan-ly-nha-so-che/checklist-ban-giao';

/** Cấp cao: cấp bậc 1 hoặc quyền admin/all — sửa phiếu đã xong, mở lại / xoá phiếu huỷ. */
export function useChecklistBanGiaoCapCao(): boolean {
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermissionFromContext();
  return toanQuyen || canAdmin;
}
