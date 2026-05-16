import type { User } from '../../../../types';
import type { FarmDuBaoSlDongThung } from './types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from './types';

export function isDuBaoSlDongThungLocked(item: FarmDuBaoSlDongThung): boolean {
  return item.trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA;
}

export function isDuBaoSlDongThungAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

export function canMutateDuBaoSlDongThung(
  user: User | null | undefined,
  item: FarmDuBaoSlDongThung,
  moduleAllowed: boolean
): boolean {
  if (!moduleAllowed) return false;
  if (isDuBaoSlDongThungAdmin(user)) return true;
  if (isDuBaoSlDongThungLocked(item)) return false;
  const creator = item.id_nguoi_tao;
  if (creator == null || creator === '') return false;
  return String(user?.id ?? '') === String(creator);
}

export function canToggleTrangThaiDuBaoSlDongThung(user: User | null | undefined): boolean {
  return isDuBaoSlDongThungAdmin(user);
}
