import type { FarmDuBaoSlDongThung } from './types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from './types';

export function isDuBaoSlDongThungLocked(item: FarmDuBaoSlDongThung): boolean {
  return item.trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA;
}

/**
 * Sửa / xóa phiếu:
 * - Quản trị (`admin` / `all`) → được sửa/xóa tất cả.
 * - Quyền thường → chỉ được sửa/xóa phiếu mình tạo (`id_nguoi_tao`) và chưa khóa.
 */
export function canMutateDuBaoSlDongThung(
  item: FarmDuBaoSlDongThung,
  moduleAllowed: boolean,
  moduleCanAdmin: boolean,
  userId: string | null | undefined
): boolean {
  if (moduleCanAdmin) return true;
  if (!moduleAllowed) return false;
  if (isDuBaoSlDongThungLocked(item)) return false;
  if (!userId || !item.id_nguoi_tao) return false;
  return String(userId) === String(item.id_nguoi_tao);
}

/** Khóa / mở khóa phiếu — chỉ quyền quản trị module. */
export function canToggleTrangThaiDuBaoSlDongThung(moduleCanAdmin: boolean): boolean {
  return moduleCanAdmin;
}
