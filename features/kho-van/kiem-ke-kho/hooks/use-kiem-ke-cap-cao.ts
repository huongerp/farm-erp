import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';

/**
 * "Cấp cao" của module kiểm kê: `cap_bac = 1` hoặc có quyền `admin`/`all` trên
 * module. Chỉ nhóm này mới sửa / xoá / đổi trạng thái đợt đã hoàn thành.
 * Cùng quy ước với phạm vi xem (`use-kiem-ke-kho-view-scope.ts`).
 */
export function useKiemKeCapCao(): boolean {
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermissionFromContext();
  return toanQuyen || canAdmin;
}
