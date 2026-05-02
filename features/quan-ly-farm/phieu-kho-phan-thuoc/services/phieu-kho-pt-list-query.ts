import type { PhieuKhoPTFilters } from '../store/usePhieuKhoPTStore';
import type { ChiTietPhieuKhoPTFilters } from '../store/useChiTietPhieuKhoPTStore';

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
};

export function buildPhieuKhoPTListServerQuery(params: {
  searchTerm: string;
  filters: PhieuKhoPTFilters;
  ngayFrom: string;
  ngayTo: string;
}): PhieuKhoPTListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo } = params;
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
  };
}

export function buildChiTietPhieuKhoPTListServerQuery(params: {
  searchTerm: string;
  filters: ChiTietPhieuKhoPTFilters;
  ngayFrom: string;
  ngayTo: string;
}): ChiTietPhieuKhoPTListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo } = params;
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
  };
}
