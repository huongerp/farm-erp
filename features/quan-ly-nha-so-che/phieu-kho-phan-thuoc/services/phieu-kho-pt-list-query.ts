import type { PhieuKhoPTFilters } from '../store/usePhieuKhoPTStore';
import type { ChiTietPhieuKhoPTFilters } from '../store/useChiTietPhieuKhoPTStore';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';

const STATUS_KEY_TO_VI: Record<string, string> = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Không duyệt',
};

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

/**
 * Phạm vi xem phiếu kho: cấp cao xem tất cả; còn lại thấy phiếu có kho đi HOẶC kho đến
 * thuộc chi nhánh được phân, hoặc phiếu do chính mình lập.
 */
export type PhieuKhoPTPhamVi = {
  viewAll: boolean;
  /** Kho được phép xem khi không phải toàn phạm vi. Rỗng = không kho nào. */
  allowedKhoIds: number[];
  /** fp_var_nhan_vien.id — phiếu mình lập luôn thấy. */
  currentEmployeeId: number | null;
};

export function buildPhieuKhoPTPhamVi(
  viewScope: Pick<EmployeeBranchModuleScope, 'viewAll' | 'viewByBranch' | 'allowedBranchIds' | 'currentEmployeeId'>,
  khoList: Kho[]
): PhieuKhoPTPhamVi {
  const me = viewScope.currentEmployeeId != null ? Number(viewScope.currentEmployeeId) : NaN;
  // Không viewByBranch → không kho nào (chỉ còn phiếu mình lập), KHÔNG phải thấy tất cả.
  const khoIds =
    viewScope.viewAll || !viewScope.viewByBranch
      ? []
      : khoList
          .filter((k) => k.id_chi_nhanh != null && viewScope.allowedBranchIds.includes(k.id_chi_nhanh))
          .map((k) => k.id);
  return {
    viewAll: viewScope.viewAll,
    allowedKhoIds: toNumIds(khoIds),
    currentEmployeeId: Number.isFinite(me) ? me : null,
  };
}

/**
 * Điều kiện `or` của PostgREST cho phạm vi xem.
 * - `null`  → xem tất cả, không thêm điều kiện.
 * - `''`    → không được xem gì (service phải chặn hết, KHÔNG phải bỏ qua lọc).
 */
export function phamViOrFilter(phamVi: PhieuKhoPTPhamVi, cotNguoiTao: string): string | null {
  if (phamVi.viewAll) return null;
  const ve: string[] = [];
  if (phamVi.allowedKhoIds.length > 0) {
    const ids = phamVi.allowedKhoIds.join(',');
    ve.push(`kho_id.in.(${ids})`, `kho_den_id.in.(${ids})`);
  }
  if (phamVi.currentEmployeeId != null) ve.push(`${cotNguoiTao}.eq.${phamVi.currentEmployeeId}`);
  return ve.join(',');
}

const TAB_TO_DB: Record<string, string> = { nhap: 'nhập', xuat: 'xuất', chuyen: 'chuyển' };

/** Tham số lọc server — tab Danh sách (gộp loại; loaiDb rỗng = cả 3). */
export type PhieuKhoPTListServerQuery = {
  searchTerm: string;
  loaiDb: string[];
  trangThaiViet: string[];
  khoIds: number[];
  khoDenIds: number[];
  ngayFrom: string;
  ngayTo: string;
  nguoiTaoIds: number[];
  nguoiDuyetIds: number[];
  phamVi: PhieuKhoPTPhamVi;
};

export type ChiTietPhieuKhoPTListServerQuery = {
  searchTerm: string;
  loaiDb: string[];
  trangThaiViet: string[];
  khoIds: number[];
  khoDenIds: number[];
  ngayFrom: string;
  ngayTo: string;
  nguoiTaoIds: number[];
  nguoiDuyetIds: number[];
  phamVi: PhieuKhoPTPhamVi;
};

export function buildPhieuKhoPTListServerQuery(params: {
  searchTerm: string;
  filters: PhieuKhoPTFilters;
  ngayFrom: string;
  ngayTo: string;
  phamVi: PhieuKhoPTPhamVi;
}): PhieuKhoPTListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo, phamVi } = params;
  const loaiArr = strArr(filters.loaiKeys);
  const loaiDbResolved = [
    ...new Set(
      loaiArr
        .map((k) => (['nhập', 'xuất', 'chuyển'].includes(k) ? k : TAB_TO_DB[k] ?? ''))
        .filter((x): x is string => x !== '')
    ),
  ].sort();
  const st = strArr(filters.status).map((k) => STATUS_KEY_TO_VI[k]).filter(Boolean);
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
    phamVi,
  };
}

export function buildChiTietPhieuKhoPTListServerQuery(params: {
  searchTerm: string;
  filters: ChiTietPhieuKhoPTFilters;
  ngayFrom: string;
  ngayTo: string;
  phamVi: PhieuKhoPTPhamVi;
}): ChiTietPhieuKhoPTListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo, phamVi } = params;
  const loaiArr = strArr(filters.loai);
  const loaiDbResolved = [
    ...new Set(
      loaiArr
        .map((k) => (['nhập', 'xuất', 'chuyển'].includes(k) ? k : TAB_TO_DB[k] ?? ''))
        .filter((x): x is string => x !== '')
    ),
  ].sort();
  const st = strArr(filters.trangThaiKeys).map((k) => STATUS_KEY_TO_VI[k]).filter(Boolean);
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
    phamVi,
  };
}
