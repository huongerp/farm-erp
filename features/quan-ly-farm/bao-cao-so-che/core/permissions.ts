import type { User } from '../../../../types';
import type { FarmBaoCaoSoChe } from './types';
import { TRANG_THAI_BAO_CAO_SO_CHE } from './types';

export function isBaoCaoSoCheLocked(item: FarmBaoCaoSoChe): boolean {
  return item.trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA;
}

export function isBaoCaoSoCheAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

export function canMutateBaoCaoSoChe(
  user: User | null | undefined,
  item: FarmBaoCaoSoChe,
  moduleAllowed: boolean
): boolean {
  if (!moduleAllowed) return false;
  if (isBaoCaoSoCheAdmin(user)) return true;
  if (isBaoCaoSoCheLocked(item)) return false;
  const creator = item.id_nguoi_tao;
  if (creator == null || creator === '') return false;
  return String(user?.id ?? '') === String(creator);
}

export function canToggleTrangThaiBaoCaoSoChe(user: User | null | undefined): boolean {
  return isBaoCaoSoCheAdmin(user);
}

export function canCopyBaoCaoSoCheToNextDay(
  user: User | null | undefined,
  item: FarmBaoCaoSoChe,
  moduleCanCreate: boolean
): boolean {
  if (!moduleCanCreate) return false;
  return canMutateBaoCaoSoChe(user, item, true);
}
