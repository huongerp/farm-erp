import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import type {
  TongHopDeXuatKyResult,
  ChiTietPhieuRow,
  LienKetDonHangRow,
  TongHopByTrangThaiRow,
  TongHopByNoiDeXuatRow,
} from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../../../kho-van/phieu-de-xuat-vat-tu/core/constants';
import { getAllPhieuDeXuatVatTu } from '../../../kho-van/phieu-de-xuat-vat-tu/services/phieu-de-xuat-vat-tu-service';
import { getAllDonDatHang } from '../../don-dat-hang/services/don-dat-hang-service';
import { getKhoList } from '../../../kho-van/danh-sach-kho/services/kho-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function inDateRange(ngay: string, dateFrom: string, dateTo: string): boolean {
  return !!ngay && ngay >= dateFrom && ngay <= dateTo;
}

/** Chi nhánh (kho nơi đề xuất) và/hoặc người đề xuất — giống module phiếu đề xuất. */
async function filterPhieuDeXuatForViewScope(
  list: Awaited<ReturnType<typeof getAllPhieuDeXuatVatTu>>,
  opts: { allowedBranchIds?: string[]; allowedCreatorUserId?: string }
): Promise<Awaited<ReturnType<typeof getAllPhieuDeXuatVatTu>>> {
  const scopeOn =
    opts.allowedBranchIds !== undefined || Boolean((opts.allowedCreatorUserId ?? '').trim());
  if (!scopeOn) return list;

  const khoList = await getKhoList();
  const noiDeXuatToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) noiDeXuatToBranchId.set(k.id, k.id_chi_nhanh);
  });
  const branches = opts.allowedBranchIds ?? [];
  const hasBranch = branches.length > 0;
  const allowedSet = hasBranch ? new Set(branches) : null;
  const creator = (opts.allowedCreatorUserId ?? '').trim();

  return list.filter((p) => {
    if (creator && String(p.id_nguoi_de_xuat) === creator) return true;
    if (!hasBranch) return false;
    const branchId = p.id_noi_de_xuat ? noiDeXuatToBranchId.get(p.id_noi_de_xuat) : undefined;
    return branchId != null && allowedSet!.has(branchId);
  });
}

function applyFilters(
  list: Awaited<ReturnType<typeof getAllPhieuDeXuatVatTu>>,
  filters: BaoCaoDeXuatVatTuFilters
) {
  const { dateFrom, dateTo, trangThaiIds, noiDeXuatIds, nguoiDeXuatIds, nguoiDuyetIds } = filters;
  return list.filter((p) => {
    if (dateFrom && dateTo && !inDateRange(p.ngay, dateFrom, dateTo)) return false;
    if (trangThaiIds.length > 0 && !trangThaiIds.includes(p.trang_thai)) return false;
    if (noiDeXuatIds.length > 0 && !noiDeXuatIds.includes(p.id_noi_de_xuat)) return false;
    if (nguoiDeXuatIds.length > 0 && !nguoiDeXuatIds.includes(p.id_nguoi_de_xuat)) return false;
    if (nguoiDuyetIds.length > 0) {
      if (!p.id_nguoi_duyet) return false;
      if (!nguoiDuyetIds.includes(p.id_nguoi_duyet)) return false;
    }
    return true;
  });
}

/** Danh sách phiếu trong kỳ (đã filter), dùng cho tab Chi tiết phiếu */
export async function getPhieuDeXuatInPeriod(
  filters: BaoCaoDeXuatVatTuFilters
): Promise<ChiTietPhieuRow[]> {
  await delay(300);
  const all = await getAllPhieuDeXuatVatTu();
  const scoped = await filterPhieuDeXuatForViewScope(all, {
    allowedBranchIds: filters.allowedBranchIds,
    allowedCreatorUserId: filters.allowedCreatorUserId,
  });
  const filtered = applyFilters(scoped, filters);
  return filtered.map((p) => ({
    id: p.id,
    so_phieu: p.so_phieu,
    ngay: p.ngay,
    ngay_can: p.ngay_can,
    id_noi_de_xuat: p.id_noi_de_xuat,
    ten_noi_de_xuat: p.ten_noi_de_xuat,
    id_nguoi_de_xuat: p.id_nguoi_de_xuat,
    ten_nguoi_de_xuat: p.ten_nguoi_de_xuat,
    id_nguoi_duyet: p.id_nguoi_duyet ?? undefined,
    ten_nguoi_duyet: p.ten_nguoi_duyet ?? undefined,
    trang_thai: p.trang_thai,
    ghi_chu: p.ghi_chu,
  }));
}

/** Tổng hợp theo kỳ: cards + bảng theo trạng thái + bảng theo nơi đề xuất + byMonth */
export async function getTongHopDeXuatKy(
  filters: BaoCaoDeXuatVatTuFilters
): Promise<TongHopDeXuatKyResult> {
  await delay(300);
  const all = await getAllPhieuDeXuatVatTu();
  const scoped = await filterPhieuDeXuatForViewScope(all, {
    allowedBranchIds: filters.allowedBranchIds,
    allowedCreatorUserId: filters.allowedCreatorUserId,
  });
  const filtered = applyFilters(scoped, filters);

  const choDuyet = filtered.filter((p) => p.trang_thai === TRANG_THAI_CHO_DUYET).length;
  const daDuyet = filtered.filter((p) => p.trang_thai === TRANG_THAI_DA_DUYET).length;
  const khongDuyet = filtered.filter((p) => p.trang_thai === TRANG_THAI_KHONG_DUYET).length;

  const TRANG_THAI_LIST = [TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET] as const;
  const byTrangThaiMap = new Map<string, number>();
  TRANG_THAI_LIST.forEach((s) => byTrangThaiMap.set(s, 0));
  filtered.forEach((p) => byTrangThaiMap.set(p.trang_thai, (byTrangThaiMap.get(p.trang_thai) ?? 0) + 1));
  const byTrangThai: TongHopByTrangThaiRow[] = TRANG_THAI_LIST.map((trang_thai) => ({
    trang_thai,
    count: byTrangThaiMap.get(trang_thai) ?? 0,
  }));

  const byNoiMap = new Map<string, { count: number; ten?: string }>();
  filtered.forEach((p) => {
    const cur = byNoiMap.get(p.id_noi_de_xuat);
    if (cur) {
      cur.count += 1;
    } else {
      byNoiMap.set(p.id_noi_de_xuat, { count: 1, ten: p.ten_noi_de_xuat });
    }
  });
  const byNoiDeXuat: TongHopByNoiDeXuatRow[] = Array.from(byNoiMap.entries()).map(([id_noi_de_xuat, v]) => ({
    id_noi_de_xuat,
    ten_noi_de_xuat: v.ten,
    count: v.count,
  }));

  const byMonthMap = new Map<string, number>();
  filtered.forEach((p) => {
    const key = p.ngay?.slice(0, 7) ?? '';
    if (key) byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + 1);
  });
  const byMonth = Array.from(byMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, count]) => {
      const [y, m] = monthKey.split('-');
      return { monthKey, label: `${m}/${y}`, count };
    });

  return {
    total: filtered.length,
    choDuyet,
    daDuyet,
    khongDuyet,
    byTrangThai,
    byNoiDeXuat,
    byMonth,
  };
}

/** Liên kết phiếu – đơn hàng: mỗi phiếu kèm cờ đã chuyển đơn và số đơn (nếu có) */
export async function getLienKetDonHang(
  filters: BaoCaoDeXuatVatTuFilters
): Promise<LienKetDonHangRow[]> {
  await delay(300);
  const allPhieu = await getAllPhieuDeXuatVatTu();
  const scoped = await filterPhieuDeXuatForViewScope(allPhieu, {
    allowedBranchIds: filters.allowedBranchIds,
    allowedCreatorUserId: filters.allowedCreatorUserId,
  });
  const filtered = applyFilters(scoped, filters);
  const allDon = await getAllDonDatHang();

  const phieuToDonMap = new Map<string, { so_phieu: string; id: string }>();
  allDon.forEach((d) => {
    if (d.id_phieu_de_xuat_vat_tu) {
      phieuToDonMap.set(d.id_phieu_de_xuat_vat_tu, {
        so_phieu: d.so_po ?? d.id,
        id: d.id,
      });
    }
  });

  return filtered.map((p) => {
    const don = phieuToDonMap.get(p.id);
    return {
      id_phieu: p.id,
      so_phieu: p.so_phieu,
      ngay: p.ngay,
      trang_thai: p.trang_thai,
      ten_noi_de_xuat: p.ten_noi_de_xuat,
      ten_nguoi_de_xuat: p.ten_nguoi_de_xuat,
      da_chuyen_don: !!don,
      so_phieu_don: don?.so_phieu,
      id_don_dat_hang: don?.id,
    };
  });
}
