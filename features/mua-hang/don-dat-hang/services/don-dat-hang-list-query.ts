import { buildEmployeeBranchScopeForServer, type BranchListScope } from '../../../../lib/branch-scope-query';
import type { DonDatHangFilters } from '../store/useDonDatHangStore';
import type { DonDatHangViewScope } from '../hooks/use-don-dat-hang-view-scope';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';

function strArr(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [];
}

function toNumIds(strIds: string[]): number[] {
  const out: number[] = [];
  for (const s of strIds) {
    const n = Number(s);
    if (!Number.isNaN(n)) out.push(n);
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

export type DonDatHangListServerQuery = {
  searchTerm: string;
  trangThaiViet: string[];
  idNhaCungCap: number[];
  idKhoNhan: number[];
  idNguoiDat: number[];
  scope: BranchListScope;
};

export function buildDonDatHangListServerQuery(params: {
  searchTerm: string;
  filters: DonDatHangFilters;
  viewScope: DonDatHangViewScope;
  khoList: Kho[];
}): DonDatHangListServerQuery {
  const { searchTerm, filters, viewScope, khoList } = params;
  const scope = buildEmployeeBranchScopeForServer(
    viewScope.viewAll,
    viewScope.viewByBranch,
    viewScope.allowedBranchIds,
    viewScope.currentEmployeeId,
    khoList
  );
  return {
    searchTerm: (searchTerm ?? '').trim(),
    trangThaiViet: [...new Set(strArr(filters.status))].sort(),
    idNhaCungCap: toNumIds(strArr(filters.nhaCungCapIds)),
    idKhoNhan: toNumIds(strArr(filters.khoNhanIds)),
    idNguoiDat: toNumIds(strArr(filters.nguoiDatIds)),
    scope,
  };
}
