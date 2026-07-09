import { buildPhieuKhoViewScopeForServer, type BranchListScope } from '../../../../lib/branch-scope-query';
import type { PhieuKhoFilters } from '../store/usePhieuKhoStore';
import type { PhieuKhoViewScope } from '../hooks/use-phieu-kho-view-scope';
import type { LoaiPhieuKhoTab } from '../core/types';
import { LOAI_TAB_TO_DB } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { ChiTietPhieuKhoFilters } from '../store/useChiTietPhieuKhoStore';

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

/** Tham số lọc + phạm vi cho getPhieuKhoPage (server). */
export type PhieuKhoListServerQuery = {
  loaiDb: string;
  searchTerm: string;
  trangThaiViet: string[];
  khoIds: number[];
  khoDenIds: number[];
  ngayFrom: string;
  ngayTo: string;
  nguoiTaoIds: number[];
  nguoiDuyetIds: number[];
  doiTacIds: number[];
  /** null = tab chuyển kho — không lọc đối tác */
  doiTacColumn: 'id_nha_cung_cap' | 'id_khach_hang' | null;
  scope: BranchListScope;
};

export type ChiTietPhieuKhoListServerQuery = {
  searchTerm: string;
  loaiDb: string[];
  trangThaiViet: string[];
  khoIds: number[];
  khoDenIds: number[];
  ngayFrom: string;
  ngayTo: string;
  nguoiTaoIds: number[];
  nguoiDuyetIds: number[];
  doiTacIds: number[];
  scope: BranchListScope;
};

export function buildPhieuKhoListServerQuery(params: {
  loaiTab: LoaiPhieuKhoTab;
  searchTerm: string;
  filters: PhieuKhoFilters;
  ngayFrom: string;
  ngayTo: string;
  viewScope: Pick<PhieuKhoViewScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'ownPhieuCreatorId'>;
  khoList: Kho[];
}): PhieuKhoListServerQuery {
  const { loaiTab, searchTerm, filters, ngayFrom, ngayTo, viewScope, khoList } = params;
  const st = strArr(filters.status)
    .map((k) => filterKeyToTrangThai(k as TrangThaiFilterKey))
    .filter(Boolean);
  const scope = buildPhieuKhoViewScopeForServer(
    viewScope.viewAll,
    viewScope.viewByBranch,
    viewScope.allowedBranchIds,
    viewScope.ownPhieuCreatorId,
    khoList
  );
  let doiTacColumn: PhieuKhoListServerQuery['doiTacColumn'] = null;
  if (loaiTab === 'nhap') doiTacColumn = 'id_nha_cung_cap';
  else if (loaiTab === 'xuat') doiTacColumn = 'id_khach_hang';
  return {
    loaiDb: LOAI_TAB_TO_DB[loaiTab],
    searchTerm: (searchTerm ?? '').trim(),
    trangThaiViet: [...new Set(st)].sort(),
    khoIds: toNumIds(strArr(filters.khoIds)),
    khoDenIds: toNumIds(strArr(filters.khoDenIds)),
    ngayFrom,
    ngayTo,
    nguoiTaoIds: toNumIds(strArr(filters.nguoiTaoIds)),
    nguoiDuyetIds: toNumIds(strArr(filters.nguoiDuyetIds)),
    doiTacIds: toNumIds(strArr(filters.doiTacIds)),
    doiTacColumn,
    scope,
  };
}

export function buildChiTietPhieuKhoListServerQuery(params: {
  searchTerm: string;
  filters: ChiTietPhieuKhoFilters;
  ngayFrom: string;
  ngayTo: string;
  viewScope: Pick<PhieuKhoViewScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'ownPhieuCreatorId'>;
  khoList: Kho[];
}): ChiTietPhieuKhoListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo, viewScope, khoList } = params;
  const loaiArr = strArr(filters.loai);
  const tabToDb: Record<string, string> = { nhap: 'nhập', xuat: 'xuất', chuyen: 'chuyển' };
  const loaiDbResolved = [
    ...new Set(
      loaiArr
        .map((k) => (['nhập', 'xuất', 'chuyển'].includes(k) ? k : tabToDb[k] ?? ''))
        .filter((x): x is string => x !== '')
    ),
  ].sort();
  const st = strArr(filters.trangThaiKeys)
    .map((k) => filterKeyToTrangThai(k as TrangThaiFilterKey))
    .filter(Boolean);
  const scope = buildPhieuKhoViewScopeForServer(
    viewScope.viewAll,
    viewScope.viewByBranch,
    viewScope.allowedBranchIds,
    viewScope.ownPhieuCreatorId,
    khoList
  );
  return {
    searchTerm: (searchTerm ?? '').trim(),
    loaiDb: loaiDbResolved,
    trangThaiViet: [...new Set(st)].sort(),
    khoIds: toNumIds(strArr(filters.khoIds)),
    khoDenIds: toNumIds(strArr(filters.khoDenIds)),
    ngayFrom,
    ngayTo,
    nguoiTaoIds: toNumIds(strArr(filters.nguoiTaoIds)),
    nguoiDuyetIds: toNumIds(strArr(filters.nguoiDuyetIds)),
    doiTacIds: toNumIds(strArr(filters.doiTacIds)),
    scope,
  };
}
