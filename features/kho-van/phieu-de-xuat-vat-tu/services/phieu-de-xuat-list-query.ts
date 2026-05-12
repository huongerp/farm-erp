import { buildEmployeeBranchScopeForServer, type BranchListScope } from '../../../../lib/branch-scope-query';
import type { PhieuDeXuatVatTuFilters } from '../store/usePhieuDeXuatVatTuStore';
import type { ChiTietTabFilters } from '../store/useChiTietTabStore';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import type { Kho } from '../../danh-sach-kho/core/types';
import { filterKeyToTrangThai, type TrangThaiFilterKey } from '../core/constants';

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

function trangThaiKeysToDb(statusKeys: string[]): string[] {
  const out = new Set<string>();
  for (const key of statusKeys) {
    if (key === 'Pending' || key === 'Approved' || key === 'Rejected') {
      out.add(filterKeyToTrangThai(key as TrangThaiFilterKey));
    } else {
      out.add(key);
    }
  }
  return [...out].sort();
}

export type PhieuDeXuatVatTuListServerQuery = {
  searchTerm: string;
  trangThaiViet: string[];
  ngayFrom: string;
  ngayTo: string;
  idNoiDeXuat: number[];
  idNguoiDeXuat: number[];
  idNguoiDuyet: number[];
  scope: BranchListScope;
};

export function buildPhieuDeXuatVatTuListServerQuery(params: {
  searchTerm: string;
  filters: PhieuDeXuatVatTuFilters;
  ngayFrom: string;
  ngayTo: string;
  viewScope: EmployeeBranchModuleScope;
  khoList: Kho[];
}): PhieuDeXuatVatTuListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo, viewScope, khoList } = params;
  const scope = buildEmployeeBranchScopeForServer(
    viewScope.viewAll,
    viewScope.viewByBranch,
    viewScope.allowedBranchIds,
    viewScope.currentEmployeeId,
    khoList
  );
  const stKeys = strArr(filters.status);
  return {
    searchTerm: (searchTerm ?? '').trim(),
    trangThaiViet: trangThaiKeysToDb(stKeys),
    ngayFrom,
    ngayTo,
    idNoiDeXuat: toNumIds(strArr(filters.noiDeXuatIds)),
    idNguoiDeXuat: toNumIds(strArr(filters.nguoiDeXuatIds)),
    idNguoiDuyet: toNumIds(strArr(filters.nguoiDuyetIds)),
    scope,
  };
}

/** Tab Chi tiết: lọc trên bảng chi tiết (cột text đồng bộ từ phiếu) + phạm vi phiếu. */
export type PhieuDeXuatChiTietListServerQuery = {
  searchTerm: string;
  trangThaiPhieuViet: string[];
  ngayFrom: string;
  ngayTo: string;
  tenNoiDeXuat: string[];
  tenNguoiDeXuat: string[];
  tenNguoiDuyet: string[];
  tenTienDoMh: string[];
  scope: BranchListScope;
};

export function buildPhieuDeXuatChiTietListServerQuery(params: {
  searchTerm: string;
  filters: ChiTietTabFilters;
  ngayFrom: string;
  ngayTo: string;
  viewScope: EmployeeBranchModuleScope;
  khoList: Kho[];
}): PhieuDeXuatChiTietListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo, viewScope, khoList } = params;
  const scope = buildEmployeeBranchScopeForServer(
    viewScope.viewAll,
    viewScope.viewByBranch,
    viewScope.allowedBranchIds,
    viewScope.currentEmployeeId,
    khoList
  );
  return {
    searchTerm: (searchTerm ?? '').trim(),
    trangThaiPhieuViet: trangThaiKeysToDb(strArr(filters.status)),
    ngayFrom,
    ngayTo,
    tenNoiDeXuat: [...new Set(strArr(filters.noiDeXuat).map((s) => s.trim()).filter(Boolean))].sort(),
    tenNguoiDeXuat: [...new Set(strArr(filters.nguoiDeXuat).map((s) => s.trim()).filter(Boolean))].sort(),
    tenNguoiDuyet: [...new Set(strArr(filters.nguoiDuyet).map((s) => s.trim()).filter(Boolean))].sort(),
    tenTienDoMh: [...new Set(strArr(filters.tienDoMh).map((s) => s.trim()).filter(Boolean))].sort(),
    scope,
  };
}
