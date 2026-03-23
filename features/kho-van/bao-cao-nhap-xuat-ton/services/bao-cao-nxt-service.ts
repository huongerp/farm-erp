import type { PhieuKho } from '../../phieu-kho/core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { HangHoa } from '../../danh-sach-hang-hoa/core/types';
import type {
  NXTReportFilters,
  NXTByPeriodResult,
  NXTByWarehouseRow,
  NXTByProductRow,
  TonTaiThoiDiemRow,
} from '../core/types';
import { getAllPhieuKho } from '../../phieu-kho/services/phieu-kho-service';
import { getAllTonKho } from '../../phieu-kho/services/ton-kho-service';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { supabase, fetchAllRows } from '../../../../lib/supabase';

/* ────────────────────────── helpers ────────────────────────── */

function inDateRange(ngay: string, dateFrom: string, dateTo: string): boolean {
  if (!ngay || !dateFrom || !dateTo) return false;
  const d = ngay.trim().slice(0, 10);
  return d >= dateFrom && d <= dateTo;
}

function isTrangThaiTinhTon(p: { trang_thai?: string | null }): boolean {
  return (p.trang_thai ?? '').trim() !== 'Không duyệt';
}

/** Lọc phiếu theo chi nhánh: nhập/xuất theo kho_id; chuyển theo kho_id HOẶC kho_den_id. */
function filterPhieuByBranch(
  list: PhieuKho[],
  khoIdToBranchId: Map<string, string>,
  allowedBranchIds: string[]
): PhieuKho[] {
  if (!allowedBranchIds?.length) return list;
  const allowedSet = new Set(allowedBranchIds);
  return list.filter((p) => {
    const branchKho = khoIdToBranchId.get(String(p.kho_id));
    if (p.kho_den_id) {
      const branchDen = khoIdToBranchId.get(String(p.kho_den_id));
      return (branchKho != null && allowedSet.has(branchKho)) || (branchDen != null && allowedSet.has(branchDen));
    }
    return branchKho != null && allowedSet.has(branchKho);
  });
}

/** Lọc tồn kho theo chi nhánh: id_kho → kho.id_chi_nhanh in allowedBranchIds. */
function filterTonKhoByBranch<T extends { id_kho: string }>(
  list: T[],
  khoIdToBranchId: Map<string, string>,
  allowedBranchIds: string[]
): T[] {
  if (!allowedBranchIds?.length) return list;
  const allowedSet = new Set(allowedBranchIds);
  return list.filter((r) => {
    const branchId = khoIdToBranchId.get(String(r.id_kho));
    return branchId != null && allowedSet.has(branchId);
  });
}

function normalizeLoai(loai: string | undefined | null): 'nhập' | 'xuất' | 'chuyển' | null {
  const l = (loai ?? '').trim().toLowerCase();
  if (l === 'nhập' || l === 'nhap') return 'nhập';
  if (l === 'xuất' || l === 'xuat') return 'xuất';
  if (l === 'chuyển' || l === 'chuyen') return 'chuyển';
  return null;
}

type Mov = { nhap: number; xuat: number };
const zeroMov = (): Mov => ({ nhap: 0, xuat: 0 });
const addMov = (map: Map<string, Mov>, key: string, nhap: number, xuat: number) => {
  const cur = map.get(key) ?? zeroMov();
  cur.nhap += nhap;
  cur.xuat += xuat;
  map.set(key, cur);
};

/* ────────────────────────── main report ────────────────────────── */

/**
 * Báo cáo tổng hợp NXT theo kỳ.
 *
 * Công thức cốt lõi (áp dụng cho mỗi cặp kho × hàng hóa):
 *   tồn_cuối_kỳ  = tồn_hiện_tại − nhập_sau_kỳ + xuất_sau_kỳ
 *   tồn_đầu_kỳ   = tồn_cuối_kỳ  − nhập_trong_kỳ + xuất_trong_kỳ
 *
 * Đảm bảo: Tồn đầu + Tổng nhập − Tổng xuất ≡ Tồn cuối.
 * Chỉ phiếu "Không duyệt" bị loại; "Chờ duyệt" + "Đã duyệt" đều tính.
 */
export async function getNXTByPeriod(filters: NXTReportFilters): Promise<NXTByPeriodResult> {
  const { dateFrom, dateTo, warehouseIds, loaiPhieu, hangHoaIds, categoryIds, allowedBranchIds } = filters;

  // ── 1. Load all data in parallel (single bulk queries, no N+1) ──
  const [allPhieu, khoList, hangHoaList, tonKhoList, allCtRaw] = await Promise.all([
    getAllPhieuKho(),
    getKhoList(),
    getAllHangHoa(),
    getAllTonKho(),
    fetchAllRows<{ id_phieu_kho: number; id_hang_hoa: number; so_luong: number }>((from, to) =>
      supabase
        .from('fp_mh_phieu_kho_chi_tiet')
        .select('id_phieu_kho, id_hang_hoa, so_luong')
        .range(from, to)
    ),
  ]);

  const khoIdToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) khoIdToBranchId.set(String(k.id), k.id_chi_nhanh);
  });
  const phieuForReport = filterPhieuByBranch(allPhieu, khoIdToBranchId, allowedBranchIds ?? []);
  const tonKhoForReport = filterTonKhoByBranch(tonKhoList, khoIdToBranchId, allowedBranchIds ?? []);

  // ── 2. Report filter sets ──
  const warehouseSet = warehouseIds?.length ? new Set(warehouseIds) : null;
  const loaiSet = loaiPhieu?.length ? new Set(loaiPhieu) : null;
  const hangHoaSet = hangHoaIds?.length ? new Set(hangHoaIds) : null;
  const categorySet = categoryIds?.length ? new Set(categoryIds) : null;

  // ── 3. Lookup maps ──
  const khoMap: Record<string, Kho> = {};
  khoList.forEach((k) => { khoMap[String(k.id)] = k; });
  const hangHoaMap: Record<string, HangHoa> = {};
  hangHoaList.forEach((h) => { hangHoaMap[String(h.id)] = h; });

  // ── 4. Group chi_tiet by phieu (bulk, no N+1) ──
  const ctByPhieu = new Map<string, { idHh: string; qty: number }[]>();
  for (const ct of allCtRaw) {
    const key = String(ct.id_phieu_kho);
    const item = { idHh: String(ct.id_hang_hoa), qty: Number(ct.so_luong) || 0 };
    const arr = ctByPhieu.get(key);
    if (arr) arr.push(item); else ctByPhieu.set(key, [item]);
  }

  const productOk = (idHh: string): boolean => {
    if (hangHoaSet && !hangHoaSet.has(idHh)) return false;
    const h = hangHoaMap[idHh];
    if (categorySet) {
      if (!h?.danh_muc_id || !categorySet.has(h.danh_muc_id)) return false;
    }
    return true;
  };

  // ── 5. Aggregate movements ──
  // afterByKH : phát sinh SAU kỳ (tất cả, không filter) → dùng để trừ ngược từ tồn hiện tại
  // periodByKH: phát sinh TRONG kỳ (có filter) → hiển thị nhập/xuất + tính tồn đầu
  const afterByKH = new Map<string, Mov>();
  const periodByKH = new Map<string, Mov>();
  const periodByKho = new Map<string, Mov>();
  const periodByHH = new Map<string, Mov>();

  for (const p of phieuForReport) {
    if (!isTrangThaiTinhTon(p)) continue;
    const d = (p.ngay ?? '').trim().slice(0, 10);
    if (!d) continue;

    const isIn = d >= dateFrom && d <= dateTo;
    const isAfter = d > dateTo;
    if (!isIn && !isAfter) continue;

    const loai = normalizeLoai(p.loai);
    if (!loai) continue;
    const khoId = String(p.kho_id);
    const khoDenId = p.kho_den_id ? String(p.kho_den_id) : null;
    const items = ctByPhieu.get(String(p.id)) ?? [];

    for (const ct of items) {
      if (ct.qty <= 0) continue;

      // ── After-period: aggregate ALL movements (no report filters) ──
      if (isAfter) {
        if (loai === 'nhập') {
          addMov(afterByKH, `${khoId}|${ct.idHh}`, ct.qty, 0);
        } else if (loai === 'xuất') {
          addMov(afterByKH, `${khoId}|${ct.idHh}`, 0, ct.qty);
        } else if (loai === 'chuyển' && khoDenId) {
          addMov(afterByKH, `${khoId}|${ct.idHh}`, 0, ct.qty);
          addMov(afterByKH, `${khoDenId}|${ct.idHh}`, ct.qty, 0);
        }
        continue;
      }

      // ── In-period: apply report filters ──
      if (!productOk(ct.idHh)) continue;
      if (loaiSet && !loaiSet.has(loai)) continue;

      if (loai === 'nhập') {
        if (warehouseSet && !warehouseSet.has(khoId)) continue;
        addMov(periodByKH, `${khoId}|${ct.idHh}`, ct.qty, 0);
        addMov(periodByKho, khoId, ct.qty, 0);
        addMov(periodByHH, ct.idHh, ct.qty, 0);
      } else if (loai === 'xuất') {
        if (warehouseSet && !warehouseSet.has(khoId)) continue;
        addMov(periodByKH, `${khoId}|${ct.idHh}`, 0, ct.qty);
        addMov(periodByKho, khoId, 0, ct.qty);
        addMov(periodByHH, ct.idHh, 0, ct.qty);
      } else if (loai === 'chuyển' && khoDenId) {
        const fromOk = !warehouseSet || warehouseSet.has(khoId);
        const toOk = !warehouseSet || warehouseSet.has(khoDenId);
        if (!fromOk && !toOk) continue;
        if (fromOk) {
          addMov(periodByKH, `${khoId}|${ct.idHh}`, 0, ct.qty);
          addMov(periodByKho, khoId, 0, ct.qty);
        }
        if (toOk) {
          addMov(periodByKH, `${khoDenId}|${ct.idHh}`, ct.qty, 0);
          addMov(periodByKho, khoDenId, ct.qty, 0);
        }
      }
    }
  }

  // ── 6. Current stock from view (tồn hiện tại = thời điểm NOW, chưa phải cuối kỳ) ──
  const currentByKH = new Map<string, number>();
  tonKhoForReport.forEach((r) => {
    const key = `${String(r.id_kho)}|${String(r.id_hang_hoa)}`;
    currentByKH.set(key, (currentByKH.get(key) ?? 0) + r.so_luong);
  });
  afterByKH.forEach((_, key) => { if (!currentByKH.has(key)) currentByKH.set(key, 0); });
  periodByKH.forEach((_, key) => { if (!currentByKH.has(key)) currentByKH.set(key, 0); });

  // ── 7. Build by-warehouse rows ──
  const byWarehouseRows: NXTByWarehouseRow[] = [];
  const khoIdsForReport = warehouseSet
    ? Array.from(warehouseSet)
    : [...new Set([...khoList.map((k) => String(k.id)), ...periodByKho.keys()])];

  for (const idKho of khoIdsForReport) {
    const k = khoMap[idKho];
    const pMov = periodByKho.get(idKho) ?? zeroMov();
    let ton_cuoi_ky = 0;
    let ton_dau_ky = 0;

    currentByKH.forEach((currentQty, key) => {
      const [kho, hh] = key.split('|');
      if (kho !== idKho || !productOk(hh)) return;
      const after = afterByKH.get(key) ?? zeroMov();
      const period = periodByKH.get(key) ?? zeroMov();
      const endQty = currentQty - after.nhap + after.xuat;
      const startQty = endQty - period.nhap + period.xuat;
      ton_cuoi_ky += endQty;
      ton_dau_ky += startQty;
    });

    byWarehouseRows.push({
      id_kho: idKho,
      ma_kho: k?.ma_kho ?? idKho,
      ten_kho: k?.ten_kho ?? idKho,
      ton_dau_ky,
      tong_nhap: pMov.nhap,
      tong_xuat: pMov.xuat,
      ton_cuoi_ky,
    });
  }

  // ── 8. Build by-product rows ──
  const byProductRows: NXTByProductRow[] = [];
  const hhIdsForReport = new Set<string>();
  periodByHH.forEach((_, id) => hhIdsForReport.add(id));
  tonKhoForReport.forEach((r) => {
    const idHh = String(r.id_hang_hoa);
    if (productOk(idHh)) hhIdsForReport.add(idHh);
  });

  hhIdsForReport.forEach((idHh) => {
    if (!productOk(idHh)) return;
    const h = hangHoaMap[idHh];
    const pMov = periodByHH.get(idHh) ?? zeroMov();
    let ton_cuoi_ky = 0;
    let ton_dau_ky = 0;

    currentByKH.forEach((currentQty, key) => {
      const [kho, hh] = key.split('|');
      if (hh !== idHh) return;
      if (warehouseSet && !warehouseSet.has(kho)) return;
      const after = afterByKH.get(key) ?? zeroMov();
      const period = periodByKH.get(key) ?? zeroMov();
      const endQty = currentQty - after.nhap + after.xuat;
      const startQty = endQty - period.nhap + period.xuat;
      ton_cuoi_ky += endQty;
      ton_dau_ky += startQty;
    });

    const maHang = h?.ma_hang ?? (h as any)?.ma_hang_hoa ?? idHh;
    const tenHang = h?.ten_hang ?? (h as any)?.ten_hang_hoa ?? '—';
    byProductRows.push({
      id_hang_hoa: idHh,
      ma_hang: maHang,
      ten_hang: tenHang,
      ten_danh_muc: h?.ten_danh_muc,
      don_vi_tinh: (h as any)?.dvt ?? h?.don_vi_tinh ?? '—',
      ton_dau_ky,
      tong_nhap: pMov.nhap,
      tong_xuat: pMov.xuat,
      ton_cuoi_ky,
    });
  });

  return { byWarehouse: byWarehouseRows, byProduct: byProductRows };
}

/* ────────────────────────── other exports ────────────────────────── */

/** Map trạng thái số (UI filter) sang text DB. */
const TRANG_THAI_NUM_TO_TEXT: Record<number, string> = {
  0: 'Chờ duyệt',
  1: 'Đã duyệt',
  2: 'Không duyệt',
};

/**
 * Lấy danh sách phiếu trong kỳ (không kèm chi_tiet; gọi getPhieuKhoById khi cần chi tiết).
 */
export async function getPhieuInPeriod(filters: NXTReportFilters): Promise<PhieuKho[]> {
  const {
    dateFrom,
    dateTo,
    warehouseIds,
    loaiPhieu,
    trangThaiPhieu,
    hangHoaIds,
    categoryIds,
    allowedBranchIds,
  } = filters;

  const needsProductFilter = (hangHoaIds?.length ?? 0) > 0 || (categoryIds?.length ?? 0) > 0;

  const [allPhieu, khoList, hangHoaList, allCtRaw] = await Promise.all([
    getAllPhieuKho(),
    getKhoList(),
    needsProductFilter ? getAllHangHoa() : Promise.resolve<HangHoa[]>([]),
    needsProductFilter
      ? fetchAllRows<{ id_phieu_kho: number; id_hang_hoa: number }>((from, to) =>
          supabase
            .from('fp_mh_phieu_kho_chi_tiet')
            .select('id_phieu_kho, id_hang_hoa')
            .range(from, to)
        )
      : Promise.resolve([]),
  ]);

  const khoIdToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) khoIdToBranchId.set(String(k.id), k.id_chi_nhanh);
  });
  const phieuForReport = filterPhieuByBranch(allPhieu, khoIdToBranchId, allowedBranchIds ?? []);

  const warehouseSet = warehouseIds.length > 0 ? new Set(warehouseIds.map(String)) : null;
  const loaiSet = loaiPhieu.length > 0 ? new Set(loaiPhieu) : null;
  const allowedTrangThai =
    trangThaiPhieu.length > 0
      ? new Set(trangThaiPhieu.map((n) => TRANG_THAI_NUM_TO_TEXT[n]))
      : null;

  const hangHoaSet = hangHoaIds?.length ? new Set(hangHoaIds.map(String)) : null;
  const categorySet = categoryIds?.length ? new Set(categoryIds.map(String)) : null;

  const hangHoaMap: Record<string, HangHoa> = {};
  if (needsProductFilter) {
    hangHoaList.forEach((h) => {
      hangHoaMap[String(h.id)] = h;
    });
  }

  const productLineMatches = (idHh: string): boolean => {
    if (hangHoaSet && !hangHoaSet.has(idHh)) return false;
    const h = hangHoaMap[idHh];
    if (categorySet) {
      if (!h?.danh_muc_id || !categorySet.has(h.danh_muc_id)) return false;
    }
    return true;
  };

  const phieuIdsWithProduct = new Set<string>();
  if (needsProductFilter) {
    for (const ct of allCtRaw) {
      const idHh = String(ct.id_hang_hoa);
      if (productLineMatches(idHh)) {
        phieuIdsWithProduct.add(String(ct.id_phieu_kho));
      }
    }
  }

  const warehouseMatches = (p: PhieuKho): boolean => {
    if (!warehouseSet) return true;
    const khoId = String(p.kho_id);
    if (p.loai === 'chuyển') {
      const toId = p.kho_den_id ? String(p.kho_den_id) : '';
      const fromOk = warehouseSet.has(khoId);
      const toOk = toId ? warehouseSet.has(toId) : false;
      return fromOk || toOk;
    }
    return warehouseSet.has(khoId);
  };

  return phieuForReport.filter((p) => {
    if (!inDateRange(p.ngay, dateFrom, dateTo)) return false;
    if (!warehouseMatches(p)) return false;
    if (loaiSet && !loaiSet.has(p.loai)) return false;
    if (allowedTrangThai && !allowedTrangThai.has(p.trang_thai)) return false;
    if (needsProductFilter && !phieuIdsWithProduct.has(String(p.id))) return false;
    return true;
  });
}

/**
 * Lấy bảng tồn tại thời điểm (hiện tại = tồn hiện tại từ view).
 */
export async function getTonAtDate(filters: Pick<NXTReportFilters, 'warehouseIds' | 'hangHoaIds' | 'categoryIds' | 'allowedBranchIds'>): Promise<TonTaiThoiDiemRow[]> {
  const { warehouseIds, hangHoaIds, categoryIds, allowedBranchIds } = filters;
  const tonKhoList = await getAllTonKho();
  const khoList = await getKhoList();
  const hangHoaList = await getAllHangHoa();

  const khoIdToBranchId = new Map<string, string>();
  khoList.forEach((k) => {
    if (k.id_chi_nhanh != null) khoIdToBranchId.set(String(k.id), k.id_chi_nhanh);
  });
  const tonKhoForReport = filterTonKhoByBranch(tonKhoList, khoIdToBranchId, allowedBranchIds ?? []);

  const warehouseSet = warehouseIds.length > 0 ? new Set(warehouseIds) : null;
  const hangHoaSet = hangHoaIds.length > 0 ? new Set(hangHoaIds) : null;
  const categorySet = categoryIds.length > 0 ? new Set(categoryIds) : null;

  const khoMap: Record<string, Kho> = {};
  khoList.forEach((k) => { khoMap[k.id] = k; });
  const hangHoaMap: Record<string, HangHoa> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h; });

  const rows: TonTaiThoiDiemRow[] = [];
  tonKhoForReport.forEach((r) => {
    if (r.so_luong === 0) return;
    if (warehouseSet && !warehouseSet.has(r.id_kho)) return;
    if (hangHoaSet && !hangHoaSet.has(r.id_hang_hoa)) return;
    const h = hangHoaMap[r.id_hang_hoa];
    if (categorySet) {
      if (!h?.danh_muc_id || !categorySet.has(h.danh_muc_id)) return;
    }
    const k = khoMap[r.id_kho];
    const maHang = h?.ma_hang ?? (h as any)?.ma_hang_hoa ?? r.id_hang_hoa;
    const tenHang = h?.ten_hang ?? (h as any)?.ten_hang_hoa ?? '—';
    rows.push({
      id_kho: r.id_kho,
      ma_kho: k?.ma_kho ?? r.id_kho,
      ten_kho: k?.ten_kho ?? r.id_kho,
      id_hang_hoa: r.id_hang_hoa,
      ma_hang: maHang,
      ten_hang: tenHang,
      ten_danh_muc: h?.ten_danh_muc,
      don_vi_tinh: h?.dvt ?? h?.don_vi_tinh ?? '—',
      so_luong: r.so_luong,
    });
  });
  return rows.sort((a, b) => a.ten_kho.localeCompare(b.ten_kho) || a.ma_hang.localeCompare(b.ma_hang));
}
