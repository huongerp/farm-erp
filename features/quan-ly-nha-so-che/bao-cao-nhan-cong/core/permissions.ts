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
