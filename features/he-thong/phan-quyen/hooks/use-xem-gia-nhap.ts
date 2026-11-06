import { useCapBacToanQuyen } from './use-cap-bac-toan-quyen';

/**
 * Luật xem giá nhập (đơn giá, thành tiền, tổng tiền/tổng giá trị của hàng hoá và phiếu kho):
 * chỉ nhân viên toàn quyền (cấp bậc 1 hoặc super admin) mới thấy, ở cả giao diện lẫn file xuất.
 * Chỉ ẩn ở tầng hiển thị — DB không chặn.
 */
export function useXemGiaNhap(): boolean {
  return useCapBacToanQuyen();
}
