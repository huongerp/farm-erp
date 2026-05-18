import type { FarmBaoCaoSoChe } from './types';
import { TRANG_THAI_BAO_CAO_SO_CHE } from './types';

export function isBaoCaoSoCheLocked(item: FarmBaoCaoSoChe): boolean {
  return item.trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA;
}

/**
 * Sửa / xóa phiếu:
 * - Quản trị (`admin` / `all`) → được sửa/xóa tất cả.
 * - Quyền thường → chỉ được sửa/xóa phiếu mình tạo (`id_nguoi_tao`) và chưa khóa.
 */
export function canMutateBaoCaoSoChe(
  item: FarmBaoCaoSoChe,
  moduleAllowed: boolean,
  moduleCanAdmin: boolean,
  userId: string | null | undefined
): boolean {
  if (moduleCanAdmin) return true;
  if (!moduleAllowed) return false;
  if (isBaoCaoSoCheLocked(item)) return false;
  if (!userId || !item.id_nguoi_tao) return false;
  return String(userId) === String(item.id_nguoi_tao);
}

/** Khóa / mở khóa phiếu — chỉ quyền quản trị module. */
export function canToggleTrangThaiBaoCaoSoChe(moduleCanAdmin: boolean): boolean {
  return moduleCanAdmin;
}

/** Sao chép sang ngày kế — quyền Thêm và phiếu mình tạo (hoặc quản trị). */
export function canCopyBaoCaoSoCheToNextDay(
  item: FarmBaoCaoSoChe,
  moduleCanCreate: boolean,
  moduleCanAdmin: boolean,
  userId: string | null | undefined
): boolean {
  if (!moduleCanCreate && !moduleCanAdmin) return false;
  return canMutateBaoCaoSoChe(item, true, moduleCanAdmin, userId);
}
