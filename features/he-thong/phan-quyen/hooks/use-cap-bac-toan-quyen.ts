import { useAuthStore } from '../../../../store/useStore';
import { laCapBacToanQuyen } from '../core/cap-bac-toan-quyen';

/**
 * Nhân viên cấp bậc 1 → bỏ qua fp_var_phan_quyen, toàn quyền mọi module
 * và xem toàn phạm vi dữ liệu.
 */
export function useCapBacToanQuyen(): boolean {
  const capBac = useAuthStore((s) => s.user?.cap_bac);
  return laCapBacToanQuyen(capBac);
}
