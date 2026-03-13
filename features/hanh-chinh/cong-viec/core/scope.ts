import type { CongViec } from './types';

export type CongViecScope = 'my' | 'managed' | 'all';

/**
 * Lọc danh sách công việc theo scope:
 * - my: công việc của tôi (tôi là trách nhiệm hoặc trong nguoi_ho_tro)
 * - managed: công việc tôi quản lý (tôi là id_nguoi_giao)
 * - all: tất cả
 */
export function filterCongViecByScope(
  list: CongViec[],
  scope: CongViecScope,
  userId: string
): CongViec[] {
  if (scope === 'all') return list;
  if (userId === '' || userId == null || userId === undefined) return [];
  const matchMy = (id: number | null) =>
    id != null && (String(id) === String(userId) || id === Number(userId));
  const matchGiao = (id: number) =>
    id === Number(userId) || String(id) === String(userId);
  if (scope === 'my') {
    return list.filter(
      (c) =>
        matchMy(c.trach_nhiem ?? null) ||
        (c.nguoi_ho_tro ?? []).some((id) => matchGiao(id))
    );
  }
  return list.filter((c) => matchGiao(c.id_nguoi_giao));
}
