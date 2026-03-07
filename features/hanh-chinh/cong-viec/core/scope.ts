import type { CongViec } from './types';

export type CongViecScope = 'my' | 'managed' | 'all';

/**
 * Lọc danh sách công việc theo scope:
 * - my: công việc của tôi (tôi là người thực hiện — trong danh_sach_nguoi_thuc_hien)
 * - managed: công việc tôi quản lý (tôi là người giao — id_nguoi_giao)
 * - all: tất cả (dùng cho local / xem toàn bộ)
 */
export function filterCongViecByScope(
  list: CongViec[],
  scope: CongViecScope,
  userId: string
): CongViec[] {
  if (scope === 'all') return list;
  if (!userId) return [];
  if (scope === 'my') {
    return list.filter((c) => c.danh_sach_nguoi_thuc_hien?.includes(userId));
  }
  return list.filter((c) => c.id_nguoi_giao === userId);
}
