import type { Kho } from '../../danh-sach-kho/core/types';
import type { PhieuKho } from '../core/types';
import type { PhieuKhoViewScope } from '../hooks/use-phieu-kho-view-scope';

/** Phiếu do user hiện tại tạo (nguoi_tao_id khớp fp_var_nhan_vien.id). */
function isOwnPhieu(p: PhieuKho, ownPhieuCreatorId: string | null): boolean {
  return !!(ownPhieuCreatorId && String(p.nguoi_tao_id ?? '') === ownPhieuCreatorId);
}

/**
 * Lọc danh sách phiếu kho theo phạm vi xem: toàn hệ thống / chi nhánh (kho, kho đích) / phiếu tự tạo.
 */
export function filterPhieuKhoListByViewScope(
  list: PhieuKho[],
  viewScope: Pick<PhieuKhoViewScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'ownPhieuCreatorId'>,
  khoList: Kho[]
): PhieuKho[] {
  if (viewScope.viewAll) return list;

  const ownId = viewScope.ownPhieuCreatorId;

  if (!viewScope.viewByBranch) {
    return ownId ? list.filter((p) => isOwnPhieu(p, ownId)) : [];
  }

  const khoIdToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) khoIdToBranchId.set(k.id, k.id_chi_nhanh);
  });
  const allowedSet = new Set(viewScope.allowedBranchIds);

  return list.filter((p) => {
    if (isOwnPhieu(p, ownId)) return true;
    if (viewScope.allowedBranchIds.length === 0) return false;
    const branchKho = khoIdToBranchId.get(p.kho_id);
    const branchKhoDen = p.kho_den_id ? khoIdToBranchId.get(p.kho_den_id) : null;
    if (p.kho_den_id == null || p.kho_den_id === '') {
      return branchKho != null && allowedSet.has(branchKho);
    }
    return (branchKho != null && allowedSet.has(branchKho)) || (branchKhoDen != null && allowedSet.has(branchKhoDen));
  });
}
