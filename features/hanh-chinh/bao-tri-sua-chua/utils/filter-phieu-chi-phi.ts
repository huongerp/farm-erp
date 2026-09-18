import type { PhieuBaoTriSuaChua } from '../core/types';
import type { BaoTriSuaChuaFilters } from '../store/useBaoTriSuaChuaStore';

/**
 * Map id tài sản → id chi nhánh. Phiếu chi phí không có cột chi nhánh,
 * chi nhánh lấy theo tài sản (tài sản kế thừa chi nhánh của nơi lưu).
 */
export type TaiSanChiNhanhMap = Map<string, string>;

export function buildTaiSanChiNhanhMap(
  assets: { id: string; id_chi_nhanh?: string | null }[]
): TaiSanChiNhanhMap {
  const map: TaiSanChiNhanhMap = new Map();
  for (const a of assets) {
    if (a.id_chi_nhanh != null && a.id_chi_nhanh !== '') {
      map.set(String(a.id), String(a.id_chi_nhanh));
    }
  }
  return map;
}

/** Chi nhánh của phiếu (suy ra từ tài sản); '' nếu tài sản chưa gán chi nhánh. */
export function getChiNhanhCuaPhieu(
  p: PhieuBaoTriSuaChua,
  branchMap: TaiSanChiNhanhMap
): string {
  return branchMap.get(String(p.id_tai_san)) ?? '';
}

export const matchHangMuc = (p: PhieuBaoTriSuaChua, f: BaoTriSuaChuaFilters) =>
  f.hang_muc.length === 0 || f.hang_muc.includes(p.id_hang_muc);

export const matchNgay = (p: PhieuBaoTriSuaChua, f: BaoTriSuaChuaFilters) =>
  (!f.dateFrom || p.ngay >= f.dateFrom) && (!f.dateTo || p.ngay <= f.dateTo);

export const matchTaiSan = (p: PhieuBaoTriSuaChua, f: BaoTriSuaChuaFilters) =>
  f.id_tai_san.length === 0 || f.id_tai_san.includes(p.id_tai_san);

export const matchChiNhanh = (
  p: PhieuBaoTriSuaChua,
  f: BaoTriSuaChuaFilters,
  branchMap: TaiSanChiNhanhMap
) => f.id_chi_nhanh.length === 0 || f.id_chi_nhanh.includes(getChiNhanhCuaPhieu(p, branchMap));

export const matchTrangThai = (p: PhieuBaoTriSuaChua, f: BaoTriSuaChuaFilters) =>
  f.trang_thai.length === 0 || f.trang_thai.includes(p.trang_thai);

export const matchNguoiTao = (p: PhieuBaoTriSuaChua, f: BaoTriSuaChuaFilters) =>
  f.id_nguoi_tao.length === 0 || f.id_nguoi_tao.includes(String(p.id_nguoi_tao ?? ''));

/** Lọc danh sách phiếu chi phí tài sản theo toàn bộ filter của toolbar. */
export function filterPhieuChiPhi(
  list: PhieuBaoTriSuaChua[],
  f: BaoTriSuaChuaFilters,
  branchMap: TaiSanChiNhanhMap
): PhieuBaoTriSuaChua[] {
  return list.filter(
    (p) =>
      matchHangMuc(p, f) &&
      matchNgay(p, f) &&
      matchTaiSan(p, f) &&
      matchChiNhanh(p, f, branchMap) &&
      matchTrangThai(p, f) &&
      matchNguoiTao(p, f)
  );
}
