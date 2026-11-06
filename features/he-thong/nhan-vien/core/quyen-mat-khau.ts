/**
 * Ai được đặt lại mật khẩu cho ai — bản sao phía UI của RPC `rpc_set_mat_khau`
 * (docs/db-schema-baseline.sql):
 *
 * - Tự đổi mật khẩu của chính mình: luôn được.
 * - Đặt cho người khác: cấp bậc 1, super admin, hoặc có quyền admin/all trên module nhân viên.
 *
 * Trước đây nút "Đổi MK" chỉ gác bằng `canUpdate`, rộng hơn cổng dưới DB nên
 * người có quyền sửa nhân viên bấm vào là dính [P0001] từ RPC.
 */
import { laNhanVienToanQuyen } from '../../phan-quyen/core/cap-bac-toan-quyen';

export interface QuyenDatMatKhauInput {
  /** Id nhân viên đang đăng nhập (null khi chưa có phiên). */
  nhanVienDangNhapId?: string | number | null;
  /** Id nhân viên đang được thao tác. */
  nhanVienMucTieuId?: string | number | null;
  /** `cap_bac` của người đang đăng nhập; 1 là cấp cao nhất. */
  capBac?: number | null;
  /** Cờ super admin của người đang đăng nhập — toàn quyền như cấp bậc 1. */
  isSuperAdmin?: boolean | null;
  /** Quyền admin/all trên module 'he-thong/nhan-vien'. */
  canAdmin?: boolean;
}

export function coQuyenDatMatKhau({
  nhanVienDangNhapId,
  nhanVienMucTieuId,
  capBac,
  isSuperAdmin,
  canAdmin = false,
}: QuyenDatMatKhauInput): boolean {
  const toi = nhanVienDangNhapId != null ? String(nhanVienDangNhapId).trim() : '';
  const mucTieu = nhanVienMucTieuId != null ? String(nhanVienMucTieuId).trim() : '';

  if (toi !== '' && toi === mucTieu) return true;

  return canAdmin || laNhanVienToanQuyen({ cap_bac: capBac, is_super_admin: isSuperAdmin });
}
