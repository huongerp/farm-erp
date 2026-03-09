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
import { getAllPhieuKho, getPhieuKhoById } from '../../phieu-kho/services/phieu-kho-service';
import { getAllTonKho } from '../../phieu-kho/services/ton-kho-service';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function inDateRange(ngay: string, dateFrom: string, dateTo: string): boolean {
  return ngay >= dateFrom && ngay <= dateTo;
}

/** Trạng thái phiếu: DB lưu text 'Chờ duyệt' | 'Đã duyệt' | 'Không duyệt'. Chỉ phiếu Không duyệt không tính tồn. */
const TRANG_THAI_KHONG_DUYET = 'Không duyệt';

/**
 * Lấy báo cáo tổng hợp NXT theo kỳ.
 * Tính phiếu Chờ duyệt + Đã duyệt cho nhập/xuất; chỉ Không duyệt không tính. Tồn cuối từ view fp_mh_ton_kho.
 */
export async function getNXTByPeriod(filters: NXTReportFilters): Promise<NXTByPeriodResult> {
  await delay(300);
  const { dateFrom, dateTo, warehouseIds, loaiPhieu, hangHoaIds, categoryIds } = filters;
  const allPhieu = await getAllPhieuKho();
  const khoList = await getKhoList();
  const hangHoaList = await getAllHangHoa();
  const tonKhoList = await getAllTonKho();

  const warehouseSet = warehouseIds.length > 0 ? new Set(warehouseIds) : null;
  const loaiSet = loaiPhieu.length > 0 ? new Set(loaiPhieu) : null;
  const hangHoaSet = hangHoaIds.length > 0 ? new Set(hangHoaIds) : null;
  const categorySet = categoryIds.length > 0 ? new Set(categoryIds) : null;

  const phieuInRange = allPhieu.filter((p) => {
    if (!inDateRange(p.ngay, dateFrom, dateTo)) return false;
    if (p.trang_thai === TRANG_THAI_KHONG_DUYET) return false; // chỉ phiếu Không duyệt không tính
    if (warehouseSet && !warehouseSet.has(p.kho_id)) return false;
    if (warehouseSet && p.kho_den_id && !warehouseSet.has(p.kho_den_id)) return false;
    if (loaiSet && !loaiSet.has(p.loai)) return false;
    return true;
  });

  const khoMap: Record<string, Kho> = {};
  khoList.forEach((k) => { khoMap[k.id] = k; });
  const hangHoaMap: Record<string, HangHoa> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h; });

  const tonMap = new Map<string, number>();
  tonKhoList.forEach((r) => tonMap.set(`${r.id_kho}|${r.id_hang_hoa}`, r.so_luong));

  type Movement = { nhap: number; xuat: number };
  const byKhoHang = new Map<string, Movement>();
  const byWarehouse = new Map<string, Movement>();
  const byProduct = new Map<string, Movement>();

  for (const p of phieuInRange) {
    const full = await getPhieuKhoById(p.id);
    const chiTiet = full?.chi_tiet ?? [];
    for (const ct of chiTiet) {
      if (hangHoaSet && !hangHoaSet.has(ct.id_hang_hoa)) continue;
      const h = hangHoaMap[ct.id_hang_hoa];
      if (categorySet && h?.danh_muc_id && !categorySet.has(h.danh_muc_id)) continue;

      const qty = ct.so_luong;
      if (p.loai === 'nhập') {
        const keyKho = `${p.kho_id}|${ct.id_hang_hoa}`;
        const cur = byKhoHang.get(keyKho) ?? { nhap: 0, xuat: 0 };
        cur.nhap += qty;
        byKhoHang.set(keyKho, cur);
        const kw = byWarehouse.get(p.kho_id) ?? { nhap: 0, xuat: 0 };
        kw.nhap += qty;
        byWarehouse.set(p.kho_id, kw);
        const kp = byProduct.get(ct.id_hang_hoa) ?? { nhap: 0, xuat: 0 };
        kp.nhap += qty;
        byProduct.set(ct.id_hang_hoa, kp);
      } else if (p.loai === 'xuất') {
        const keyKho = `${p.kho_id}|${ct.id_hang_hoa}`;
        const cur = byKhoHang.get(keyKho) ?? { nhap: 0, xuat: 0 };
        cur.xuat += qty;
        byKhoHang.set(keyKho, cur);
        const kw = byWarehouse.get(p.kho_id) ?? { nhap: 0, xuat: 0 };
        kw.xuat += qty;
        byWarehouse.set(p.kho_id, kw);
        const kp = byProduct.get(ct.id_hang_hoa) ?? { nhap: 0, xuat: 0 };
        kp.xuat += qty;
        byProduct.set(ct.id_hang_hoa, kp);
      } else if (p.loai === 'chuyển' && p.kho_den_id) {
        const keyFrom = `${p.kho_id}|${ct.id_hang_hoa}`;
        const keyTo = `${p.kho_den_id}|${ct.id_hang_hoa}`;
        const curFrom = byKhoHang.get(keyFrom) ?? { nhap: 0, xuat: 0 };
        curFrom.xuat += qty;
        byKhoHang.set(keyFrom, curFrom);
        const curTo = byKhoHang.get(keyTo) ?? { nhap: 0, xuat: 0 };
        curTo.nhap += qty;
        byKhoHang.set(keyTo, curTo);
        const kwFrom = byWarehouse.get(p.kho_id) ?? { nhap: 0, xuat: 0 };
        kwFrom.xuat += qty;
        byWarehouse.set(p.kho_id, kwFrom);
        const kwTo = byWarehouse.get(p.kho_den_id) ?? { nhap: 0, xuat: 0 };
        kwTo.nhap += qty;
        byWarehouse.set(p.kho_den_id, kwTo);
      }
    }
  }

  const productPassesFilter = (id_hang_hoa: string): boolean => {
    if (hangHoaSet && !hangHoaSet.has(id_hang_hoa)) return false;
    const h = hangHoaMap[id_hang_hoa];
    if (categorySet && h?.danh_muc_id && !categorySet.has(h.danh_muc_id)) return false;
    return true;
  };

  const byWarehouseRows: NXTByWarehouseRow[] = [];
  const khoIdsForReport = warehouseSet ? Array.from(warehouseSet) : khoList.map((k) => k.id);
  for (const id_kho of khoIdsForReport) {
    const k = khoMap[id_kho];
    const mov = byWarehouse.get(id_kho) ?? { nhap: 0, xuat: 0 };
    let ton_dau = 0;
    let ton_cuoi = 0;
    tonKhoList.filter((r) => r.id_kho === id_kho && productPassesFilter(r.id_hang_hoa)).forEach((r) => {
      ton_cuoi += r.so_luong;
      const m = byKhoHang.get(`${id_kho}|${r.id_hang_hoa}`) ?? { nhap: 0, xuat: 0 };
      ton_dau += r.so_luong - m.nhap + m.xuat;
    });
    byWarehouseRows.push({
      id_kho,
      ma_kho: k?.ma_kho ?? id_kho,
      ten_kho: k?.ten_kho ?? id_kho,
      ton_dau_ky: ton_dau,
      tong_nhap: mov.nhap,
      tong_xuat: mov.xuat,
      ton_cuoi_ky: ton_cuoi,
    });
  }

  const byProductRows: NXTByProductRow[] = [];
  const productIds = new Set<string>();
  byProduct.forEach((_, id) => productIds.add(id));
  tonKhoList.forEach((r) => productIds.add(r.id_hang_hoa));
  productIds.forEach((id_hang_hoa) => {
    const h = hangHoaMap[id_hang_hoa];
    if (hangHoaSet && !hangHoaSet.has(id_hang_hoa)) return;
    if (categorySet && h?.danh_muc_id && !categorySet.has(h.danh_muc_id)) return;
    const mov = byProduct.get(id_hang_hoa) ?? { nhap: 0, xuat: 0 };
    let ton_cuoi = 0;
    let ton_dau = 0;
    const tonRowsForProduct = tonKhoList.filter((r) => {
      if (r.id_hang_hoa !== id_hang_hoa) return false;
      if (warehouseSet && !warehouseSet.has(r.id_kho)) return false;
      return true;
    });
    tonRowsForProduct.forEach((r) => {
      ton_cuoi += r.so_luong;
      const m = byKhoHang.get(`${r.id_kho}|${id_hang_hoa}`) ?? { nhap: 0, xuat: 0 };
      ton_dau += r.so_luong - m.nhap + m.xuat;
    });
    const maHang = h?.ma_hang ?? h?.ma_hang_hoa ?? id_hang_hoa;
    const tenHang = h?.ten_hang ?? h?.ten_hang_hoa ?? '—';
    byProductRows.push({
      id_hang_hoa,
      ma_hang: maHang,
      ten_hang: tenHang,
      ten_danh_muc: h?.ten_danh_muc,
      don_vi_tinh: h?.dvt ?? h?.don_vi_tinh ?? '—',
      ton_dau_ky: ton_dau,
      tong_nhap: mov.nhap,
      tong_xuat: mov.xuat,
      ton_cuoi_ky: ton_cuoi,
    });
  });

  return { byWarehouse: byWarehouseRows, byProduct: byProductRows };
}

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
  await delay(250);
  const { dateFrom, dateTo, warehouseIds, loaiPhieu, trangThaiPhieu } = filters;
  const allPhieu = await getAllPhieuKho();
  const warehouseSet = warehouseIds.length > 0 ? new Set(warehouseIds) : null;
  const loaiSet = loaiPhieu.length > 0 ? new Set(loaiPhieu) : null;
  const allowedTrangThai =
    trangThaiPhieu.length > 0
      ? new Set(trangThaiPhieu.map((n) => TRANG_THAI_NUM_TO_TEXT[n]))
      : null;

  return allPhieu.filter((p) => {
    if (!inDateRange(p.ngay, dateFrom, dateTo)) return false;
    if (warehouseSet && !warehouseSet.has(p.kho_id)) return false;
    if (warehouseSet && p.kho_den_id && !warehouseSet.has(p.kho_den_id)) return false;
    if (loaiSet && !loaiSet.has(p.loai)) return false;
    if (allowedTrangThai && !allowedTrangThai.has(p.trang_thai)) return false;
    return true;
  });
}

/**
 * Lấy bảng tồn tại thời điểm (hiện tại mock = tồn hiện tại).
 */
export async function getTonAtDate(filters: Pick<NXTReportFilters, 'warehouseIds' | 'hangHoaIds' | 'categoryIds'>): Promise<TonTaiThoiDiemRow[]> {
  await delay(200);
  const { warehouseIds, hangHoaIds, categoryIds } = filters;
  const tonKhoList = await getAllTonKho();
  const khoList = await getKhoList();
  const hangHoaList = await getAllHangHoa();

  const warehouseSet = warehouseIds.length > 0 ? new Set(warehouseIds) : null;
  const hangHoaSet = hangHoaIds.length > 0 ? new Set(hangHoaIds) : null;
  const categorySet = categoryIds.length > 0 ? new Set(categoryIds) : null;

  const khoMap: Record<string, Kho> = {};
  khoList.forEach((k) => { khoMap[k.id] = k; });
  const hangHoaMap: Record<string, HangHoa> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h; });

  const rows: TonTaiThoiDiemRow[] = [];
  tonKhoList.forEach((r) => {
    if (r.so_luong === 0) return;
    if (warehouseSet && !warehouseSet.has(r.id_kho)) return;
    if (hangHoaSet && !hangHoaSet.has(r.id_hang_hoa)) return;
    const h = hangHoaMap[r.id_hang_hoa];
    if (categorySet && h?.danh_muc_id && !categorySet.has(h.danh_muc_id)) return;
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
