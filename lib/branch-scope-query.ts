/**
 * Phạm vi chi nhánh + "bản ghi của tôi" dùng chung cho lọc server (PostgREST).
 * Khớp ý tưởng filter client: filter*ListByViewScope + danh sách kho.
 */

export type BranchListScope = {
  viewAll: boolean;
  viewByBranch: boolean;
  /** id kho (số) có id_chi_nhanh thuộc allowedBranchIds — đã sort tăng dần */
  allowedKhoNumericIds: number[];
  /** fp_var_nhan_vien.id dạng số cho .eq trên cột bigint/int */
  ownEmployeeIdNum: number | null;
};

export function parseEmployeeIdToNum(id: string | null | undefined): number | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

/** Kho thuộc chi nhánh được phép (theo id_chi_nhanh). */
export function resolveAllowedKhoNumericIds(
  khoList: { id: string; id_chi_nhanh?: string | null }[],
  allowedBranchIds: string[]
): number[] {
  const allow = new Set(allowedBranchIds.map(String));
  const ids = new Set<number>();
  for (const k of khoList) {
    if (k.id_chi_nhanh != null && allow.has(String(k.id_chi_nhanh))) {
      const n = Number(k.id);
      if (!Number.isNaN(n)) ids.add(n);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

export function buildPhieuKhoViewScopeForServer(
  viewAll: boolean,
  viewByBranch: boolean,
  allowedBranchIds: string[],
  ownPhieuCreatorId: string | null,
  khoList: { id: string; id_chi_nhanh?: string | null }[]
): BranchListScope {
  if (viewAll) {
    return { viewAll: true, viewByBranch: false, allowedKhoNumericIds: [], ownEmployeeIdNum: null };
  }
  const ownEmployeeIdNum = parseEmployeeIdToNum(ownPhieuCreatorId);
  if (!viewByBranch) {
    return { viewAll: false, viewByBranch: false, allowedKhoNumericIds: [], ownEmployeeIdNum };
  }
  return {
    viewAll: false,
    viewByBranch: true,
    allowedKhoNumericIds: resolveAllowedKhoNumericIds(khoList, allowedBranchIds),
    ownEmployeeIdNum,
  };
}

export function buildEmployeeBranchScopeForServer(
  viewAll: boolean,
  viewByBranch: boolean,
  allowedBranchIds: string[],
  currentEmployeeId: string | null,
  khoList: { id: string; id_chi_nhanh?: string | null }[]
): BranchListScope {
  return buildPhieuKhoViewScopeForServer(viewAll, viewByBranch, allowedBranchIds, currentEmployeeId, khoList);
}
