import type { DonDatHangTrangThai } from './types';

export const DON_DAT_HANG_TRANG_THAI: DonDatHangTrangThai[] = [0, 1, 2, 3, 4, 5, 6, 7];

/** Map trạng thái -> key locale (donDatHang.status.*) */
export const TRANG_THAI_KEY: Record<DonDatHangTrangThai, string> = {
  0: 'draft',
  1: 'pending',
  2: 'sent',
  3: 'confirmed',
  4: 'delivering',
  5: 'received',
  6: 'closed',
  7: 'cancelled',
};
