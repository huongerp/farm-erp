import type { User } from '../../../../types';
import type { FarmBaoCaoNhanCong } from './types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from './types';

export function isBaoCaoNhanCongLocked(item: FarmBaoCaoNhanCong): boolean {
  return item.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA;
}

export function isBaoCaoNhanCongAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

/** Sửa / xóa phiếu: đã khóa → chỉ admin; đang mở → admin hoặc người tạo (có id_nguoi_tao). */
export function canMutateBaoCaoNhanCong(
  user: User | null | undefined,
  item: FarmBaoCaoNhanCong,
  moduleAllowed: boolean
): boolean {
  if (!moduleAllowed) return false;
  if (isBaoCaoNhanCongAdmin(user)) return true;
  if (isBaoCaoNhanCongLocked(item)) return false;
  const creator = item.id_nguoi_tao;
  if (creator == null || creator === '') return false;
  return String(user?.id ?? '') === String(creator);
}

/** Đổi trạng thái khóa / mở — chỉ admin. */
export function canToggleTrangThaiBaoCaoNhanCong(user: User | null | undefined): boolean {
  return isBaoCaoNhanCongAdmin(user);
}

/** Sao chép sang ngày kế: coi như tạo phiếu mới từ nguồn — cùng quy tắc với sửa nguồn. */
export function canCopyBaoCaoNhanCongToNextDay(
  user: User | null | undefined,
  item: FarmBaoCaoNhanCong,
  moduleCanCreate: boolean
): boolean {
  if (!moduleCanCreate) return false;
  return canMutateBaoCaoNhanCong(user, item, true);
}
