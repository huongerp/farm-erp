/**
 * Phạm vi xem bảo dưỡng thiết bị theo phân quyền module + farm (chi nhánh) của nhân viên.
 * Admin / all hoặc cấp bậc 1 → xem mọi farm; khác → chỉ farm được phân.
 * DB không lọc theo chi nhánh (RLS theo module) — phạm vi farm lọc ở app, như Giám sát chất lượng.
 */
import { useEffect, useMemo } from 'react';
import { useEmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { useAuthStore } from '../../../../store/useStore';
import { chonFarmMacDinh } from '../core/farm-mac-dinh';
import { useBaoDuongFarmStore } from '../store/useBaoDuongThietBiStore';

export const BAO_DUONG_MODULE_ID = 'quan-ly-nha-so-che/bao-duong-thiet-bi';

export function useBaoDuongViewScope() {
  return useEmployeeBranchModuleScope(BAO_DUONG_MODULE_ID);
}

const KHONG_CO_FARM: Branch[] = [];

export interface BaoDuongFarm {
  /** Farm đang xem (đã hợp lệ hoá theo phạm vi); null = đang tải hoặc không có farm nào */
  farmId: string | null;
  setFarmId: (id: string | null) => void;
  /** Farm trong phạm vi được xem */
  farms: Branch[];
  /** Mọi chi nhánh — tra tên farm */
  tenFarm: Map<string, string>;
  isLoading: boolean;
}

/** Farm đang chọn + danh sách farm trong phạm vi; farm lưu trong store ngoài phạm vi thì tự sửa. */
export function useBaoDuongFarm(): BaoDuongFarm {
  const scope = useBaoDuongViewScope();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? KHONG_CO_FARM;
  const farmCuaToi = useAuthStore((s) => s.user?.id_chi_nhanh ?? null);
  const farmLuu = useBaoDuongFarmStore((s) => s.farmId);
  const setFarmId = useBaoDuongFarmStore((s) => s.setFarmId);

  const isLoading = scope.isLoading || branchesQuery.isPending;

  const farms = useMemo(() => {
    if (scope.viewAll) return branches;
    const allowed = new Set(scope.allowedBranchIds);
    return branches.filter((b) => allowed.has(b.id));
  }, [branches, scope.viewAll, scope.allowedBranchIds]);

  const tenFarm = useMemo(() => new Map(branches.map((b) => [b.id, b.ten_chi_nhanh])), [branches]);

  const farmId = isLoading
    ? null
    : chonFarmMacDinh({
        hienTai: farmLuu,
        viewAll: scope.viewAll,
        allowedBranchIds: scope.allowedBranchIds,
        tatCaBranchIds: branches.map((b) => b.id),
        farmCuaToi: farmCuaToi != null ? String(farmCuaToi) : null,
      });

  useEffect(() => {
    if (!isLoading && farmId !== farmLuu) setFarmId(farmId);
  }, [isLoading, farmId, farmLuu, setFarmId]);

  return { farmId, setFarmId, farms, tenFarm, isLoading };
}
