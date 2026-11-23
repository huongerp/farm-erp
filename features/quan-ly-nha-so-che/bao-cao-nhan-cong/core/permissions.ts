import type { FarmBaoCaoNhanCong } from './types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from './types';

export const BAO_CAO_NHAN_CONG_MODULE_ID = 'quan-ly-nha-so-che/bao-cao-nhan-cong' as const;

export function isBaoCaoNhanCongLocked(item: FarmBaoCaoNhanCong): boolean {
  return item.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA;
}

/**
 * Sửa / xóa phiếu:
 * - Quản trị (`admin` / `all`) → được sửa/xóa tất cả.
 * - Quyền thường (Sửa/Xóa) → sửa/xóa mọi phiếu chưa khóa.
 */
export function canMutateBaoCaoNhanCong(
  item: FarmBaoCaoNhanCong,
  moduleAllowed: boolean,
  moduleCanAdmin: boolean
): boolean {
  if (moduleCanAdmin) return true;
  if (!moduleAllowed) return false;
  return !isBaoCaoNhanCongLocked(item);
}

/** Khóa / mở khóa phiếu — chỉ quyền quản trị module. */
export function canToggleTrangThaiBaoCaoNhanCong(moduleCanAdmin: boolean): boolean {
  return moduleCanAdmin;
}

/** Sao chép sang ngày kế — quyền Thêm (tạo phiếu mới). */
export function canCopyBaoCaoNhanCongToNextDay(moduleCanCreate: boolean): boolean {
  return moduleCanCreate;
}

export interface QuyenThemViTriInput {
  /** fp_var_nhan_vien.is_super_admin — tài khoản super admin. */
  isSuperAdmin?: boolean | null;
}

/**
 * Thêm vị trí công việc MỚI vào danh mục dùng chung — chỉ super admin (`is_super_admin`).
 * Người khác chỉ chọn vị trí có sẵn. Khớp policy INSERT ở migration 097.
 */
export function coQuyenThemViTri(input: QuyenThemViTriInput | null | undefined): boolean {
  return input?.isSuperAdmin === true;
}

/**
 * Thêm tên nhân viên MỚI vào danh mục `fp_var_nhan_vien_so_che` — chỉ super admin (`is_super_admin`).
 * Người khác chỉ chọn tên có sẵn; sửa tên/vị trí/chuyền trong dialog danh mục vẫn giữ nguyên.
 * Khớp policy INSERT ở migration 098.
 */
export function coQuyenThemNhanVien(input: QuyenThemViTriInput | null | undefined): boolean {
  return input?.isSuperAdmin === true;
}
