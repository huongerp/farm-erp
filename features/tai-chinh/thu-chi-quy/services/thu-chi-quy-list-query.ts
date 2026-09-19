/**
 * Chuyển filter UI → object truy vấn thuần cho danh sách sổ quỹ (test được,
 * không đụng PostgREST). Service chỉ việc áp object này lên query builder.
 */
import { resolveAllowedChiNhanhIds, type QuyBranchScope } from '../utils/quy-view-scope';
import { TRANG_THAI_THU_CHI_QUY } from '../core/types';
import type { LoaiThuChi, ThuChiNguon, TrangThaiThuChiQuy } from '../core/types';
import type { ThuChiQuyFilters } from '../store/useThuChiQuyStore';

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function toNumIds(ids: string[]): number[] {
  const out = new Set<number>();
  for (const s of ids) {
    const n = Number(s);
    if (Number.isFinite(n) && !Number.isNaN(n)) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

export interface ThuChiQuyListServerQuery {
  searchTerm: string;
  /** null = không lọc chi nhánh (chỉ khi viewAll và người dùng chọn "tất cả") */
  chiNhanhIds: number[] | null;
  loai: LoaiThuChi[];
  hangMucIds: number[];
  nguonChungTu: ThuChiNguon[];
  nguoiTaoIds: number[];
  /** Rỗng = không lọc trạng thái (thấy cả phiếu mở lẫn phiếu đã khoá). */
  trangThai: TrangThaiThuChiQuy[];
  ngayFrom: string;
  ngayTo: string;
}

export function buildThuChiQuyListServerQuery(params: {
  searchTerm: string;
  filters: ThuChiQuyFilters;
  ngayFrom: string;
  ngayTo: string;
  /** Farm người dùng đang chọn trên toolbar (rỗng = tất cả farm trong phạm vi) */
  chiNhanhDangXem: string[];
  viewScope: QuyBranchScope;
}): ThuChiQuyListServerQuery {
  const { searchTerm, filters, ngayFrom, ngayTo, chiNhanhDangXem, viewScope } = params;

  const allowed = resolveAllowedChiNhanhIds(viewScope);
  let chiNhanhIds: number[] | null = allowed;
  const chon = toNumIds(strArr(chiNhanhDangXem));
  if (chon.length > 0) {
    // Chọn farm cụ thể: chỉ giữ farm nằm trong phạm vi được phân (fail-closed).
    const hopLe = allowed === null ? chon : chon.filter((id) => allowed.includes(id));
    chiNhanhIds = hopLe.length > 0 ? hopLe : allowed;
  }

  const loai = strArr(filters.loai).filter((v): v is LoaiThuChi => v === 'thu' || v === 'chi');
  const nguonChungTu = strArr(filters.nguonChungTu).filter((v): v is ThuChiNguon =>
    v === 'don_dat_hang' || v === 'de_xuat_mua_hang' || v === 'chi_phi_tai_san'
  );
  const trangThai = strArr(filters.trangThai).filter((v): v is TrangThaiThuChiQuy =>
    v === TRANG_THAI_THU_CHI_QUY.MO ||
    v === TRANG_THAI_THU_CHI_QUY.KHOA ||
    v === TRANG_THAI_THU_CHI_QUY.CHO_MO
  );

  return {
    searchTerm: (searchTerm ?? '').trim(),
    chiNhanhIds,
    loai: [...new Set(loai)].sort(),
    hangMucIds: toNumIds(strArr(filters.hangMucIds)),
    nguonChungTu: [...new Set(nguonChungTu)].sort(),
    nguoiTaoIds: toNumIds(strArr(filters.nguoiTaoIds)),
    trangThai: [...new Set(trangThai)].sort(),
    ngayFrom,
    ngayTo,
  };
}
