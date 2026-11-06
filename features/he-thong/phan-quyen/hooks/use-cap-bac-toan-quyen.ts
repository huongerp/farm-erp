import { useAuthStore } from '../../../../store/useStore';
import { laNhanVienToanQuyen } from '../core/cap-bac-toan-quyen';

/**
 * Nhân viên cấp bậc 1 hoặc super admin → bỏ qua fp_var_phan_quyen, toàn quyền mọi module
 * và xem toàn phạm vi dữ liệu.
 */
export function useCapBacToanQuyen(): boolean {
  const capBac = useAuthStore((s) => s.user?.cap_bac);
  const isSuperAdmin = useAuthStore((s) => s.user?.is_super_admin);
  return laNhanVienToanQuyen({ cap_bac: capBac, is_super_admin: isSuperAdmin });
}
