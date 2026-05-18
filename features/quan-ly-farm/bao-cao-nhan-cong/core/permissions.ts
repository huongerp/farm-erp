import type { FarmBaoCaoNhanCong } from './types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from './types';

export const BAO_CAO_NHAN_CONG_MODULE_ID = 'quan-ly-farm/bao-cao-nhan-cong' as const;

export function isBaoCaoNhanCongLocked(item: FarmBaoCaoNhanCong): boolean {
  return item.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA;
}

/**
 * Sửa / xóa phiếu:
 * - Quản trị (`admin` / `all`) → được sửa/xóa tất cả.
 * - Quyền thường → chỉ được sửa/xóa phiếu mình tạo (`id_nguoi_tao`) và chưa khóa.
 */
export function canMutateBaoCaoNhanCong(
  item: FarmBaoCaoNhanCong,
  moduleAllowed: boolean,
  moduleCanAdmin: boolean,
  userId: string | null | undefined
): boolean {
  if (moduleCanAdmin) return true;
  if (!moduleAllowed) return false;
  if (isBaoCaoNhanCongLocked(item)) return false;
  if (!userId || !item.id_nguoi_tao) return false;
  return String(userId) === String(item.id_nguoi_tao);
}

/** Khóa / mở khóa phiếu — chỉ quyền quản trị module. */
export function canToggleTrangThaiBaoCaoNhanCong(moduleCanAdmin: boolean): boolean {
  return moduleCanAdmin;
}

/** Sao chép sang ngày kế — quyền Thêm (tạo phiếu mới). */
export function canCopyBaoCaoNhanCongToNextDay(moduleCanCreate: boolean): boolean {
  return moduleCanCreate;
}
