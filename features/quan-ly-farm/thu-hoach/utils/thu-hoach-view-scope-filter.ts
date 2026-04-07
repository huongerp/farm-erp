import type { FarmThuHoach } from '../core/types';
import type { ThuHoachViewScope } from '../hooks/use-thu-hoach-view-scope';

function isOwnRecord(r: FarmThuHoach, creatorId: string | null): boolean {
  return !!(creatorId && r.id_nguoi_tao != null && String(r.id_nguoi_tao) === String(creatorId));
}

/**
 * Lọc danh sách thu hoạch theo phạm vi: toàn hệ thống / chi nhánh farm / bản ghi tự tạo.
 */
export function filterThuHoachListByViewScope(
  list: FarmThuHoach[],
  viewScope: Pick<ThuHoachViewScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'ownCreatorId'>
): FarmThuHoach[] {
  if (viewScope.viewAll) return list;

  const ownId = viewScope.ownCreatorId;

  if (!viewScope.viewByBranch) {
    return ownId ? list.filter((r) => isOwnRecord(r, ownId)) : [];
  }

  const allowedSet = new Set(viewScope.allowedBranchIds.map(String));

  return list.filter((r) => {
    if (isOwnRecord(r, ownId)) return true;
    if (viewScope.allowedBranchIds.length === 0) return false;
    const bid = r.id_chi_nhanh != null ? String(r.id_chi_nhanh) : '';
    return bid !== '' && allowedSet.has(bid);
  });
}
