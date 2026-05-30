import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import type { FarmBaoCaoSoChe } from '../../bao-cao-so-che/core/types';
import type { FarmDuBaoSlDongThung } from '../../du-bao-sl-dong-thung/core/types';
import {
  normalizeChiTietForDisplay,
  sumTongCongQuyDoiPhieu,
  sumTongGioTangCaTichPhieu,
  sumTongCongQuyDoiTuChiTiet,
} from '../../bao-cao-nhan-cong/core/types';
import { displayLoaiTotalsOnCt } from '../../bao-cao-nhan-cong/core/ct-sub';
import { sumTienThuongKpiThuong } from '../../bao-cao-so-che/core/types';
import {
  computeBaoCaoSoCheKpis,
  buildBaoCaoSoCheKpiThuongPresetSources,
  enrichBaoCaoSoCheKpiThuongRows,
} from '../../bao-cao-so-che/core/bcsc-kpi';
import { sumPhamCapDisplayTotals } from '../../bao-cao-so-che/core/pham-cap-derived';
import { computeKpiPhanTram } from '../../shared/kpi-thuong/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../../du-bao-sl-dong-thung/core/kpi';
import type {
  ThongKeSanXuatRow,
  ThongKeSanXuatFilters,
  ThongKeSanXuatSummary,
  BcncSnapshot,
  KpiSnapshot,
} from './types';

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

// ─── BCNC snapshot ────────────────────────────────────────────────────────────

function buildBcncSnapshot(bcnc: FarmBaoCaoNhanCong): BcncSnapshot {
  const { production, vRow } = normalizeChiTietForDisplay(bcnc.chi_tiet ?? []);
  const tongCongQuyDoi = sumTongCongQuyDoiPhieu(bcnc);
  const tongGioTangCaTich = sumTongGioTangCaTichPhieu(bcnc);
  const cnSanXuatNgay = production.reduce((s, r) => s + num(r.sl_cong_ngay), 0);
  const cnSanXuatNua = production.reduce((s, r) => s + num(r.sl_cong_nua), 0);
  const cnTangCa = production.reduce((s, r) => s + num(r.sl_tang_ca), 0);
  const tongCongQuyDoiSanXuat = sumTongCongQuyDoiTuChiTiet(production);
  const vCnNgay = displayLoaiTotalsOnCt(vRow, 'CN_NGAY');
  const vCnNua = displayLoaiTotalsOnCt(vRow, 'CN_NUA');
  const cnDinhBien = vCnNgay.nhanSu + vCnNua.nhanSu;
  const kDinhBien = cnDinhBien > 0 ? tongCongQuyDoiSanXuat / cnDinhBien : null;
  return { tongCongQuyDoi, tongGioTangCaTich, cnSanXuatNgay, cnSanXuatNua, cnTangCa, tongCongQuyDoiSanXuat, cnDinhBien, kDinhBien };
}

// ─── KPI snapshot ─────────────────────────────────────────────────────────────

const KPI_DAT_VALUES = new Set(['Đạt', 'Tốt']);
const BCSC_KPI_PRESET_COUNT = 3;

function buildKpiSnapshot(
  bcsc: FarmBaoCaoSoChe,
  bcnc: FarmBaoCaoNhanCong | null,
  dbdt: FarmDuBaoSlDongThung | null
): KpiSnapshot {
  const rawRows = bcsc.kpi_thuong ?? [];
  const phamCapTotals = sumPhamCapDisplayTotals(bcsc.pham_cap ?? []);
  const kpis = computeBaoCaoSoCheKpis(
    phamCapTotals.so_thung_quy_doi,
    bcnc,
    phamCapTotals.tong_kg,
    bcsc.tong_luong
  );
  const presetSources = buildBaoCaoSoCheKpiThuongPresetSources(
    kpis,
    Number.isFinite(Number(bcsc.danh_gia_loi_qc_pct)) ? Number(bcsc.danh_gia_loi_qc_pct) : null,
    dbdt,
    phamCapTotals.so_thung
  );
  const enriched = enrichBaoCaoSoCheKpiThuongRows(rawRows, presetSources);
  const rows = enriched.map((row, index) => {
    if (index >= BCSC_KPI_PRESET_COUNT) return row;
    if (row.phan_tram != null) return row;
    const pct = computeKpiPhanTram(row.muc_tieu, row.thuc_te);
    return pct != null ? { ...row, phan_tram: pct } : row;
  });
  const validRows = rows.filter((r) => r.danh_gia != null || num(r.tien_thuong) > 0);
  const tongKpi = validRows.length;
  const soKpiDat = validRows.filter((r) => r.danh_gia != null && KPI_DAT_VALUES.has(r.danh_gia)).length;
  const tatCaKpiDat = tongKpi > 0 && soKpiDat === tongKpi;
  const tongTienThuong = sumTienThuongKpiThuong(rows);
  return { rows, soKpiDat, tongKpi, tatCaKpiDat, tongTienThuong };
}

// ─── Merge ────────────────────────────────────────────────────────────────────

export function mergeThongKeSanXuatRows(
  bcncList: FarmBaoCaoNhanCong[],
  bcscList: FarmBaoCaoSoChe[],
  dbdtList: FarmDuBaoSlDongThung[]
): ThongKeSanXuatRow[] {
  type Slot = { ngay: string; id_chi_nhanh: string; ten_chi_nhanh: string; bcnc: FarmBaoCaoNhanCong | null; bcsc: FarmBaoCaoSoChe | null; dbdt: FarmDuBaoSlDongThung | null };
  const makeKey = (ngay: string, id: string | null) => `${ngay.slice(0, 10)}|${id ?? ''}`;
  const rowMap = new Map<string, Slot>();

  const ensure = (ngay: string, id: string | null, ten: string | null) => {
    const key = makeKey(ngay, id);
    if (!rowMap.has(key)) rowMap.set(key, { ngay: ngay.slice(0, 10), id_chi_nhanh: id ?? '', ten_chi_nhanh: ten ?? id ?? '—', bcnc: null, bcsc: null, dbdt: null });
    return rowMap.get(key)!;
  };

  for (const r of bcncList) { const s = ensure(r.ngay, r.id_chi_nhanh, r.ten_chi_nhanh); s.bcnc = r; if (s.ten_chi_nhanh === '—') s.ten_chi_nhanh = r.ten_chi_nhanh ?? r.id_chi_nhanh ?? '—'; }
  for (const r of bcscList) { const s = ensure(r.ngay, r.id_chi_nhanh, r.ten_chi_nhanh); s.bcsc = r; if (s.ten_chi_nhanh === '—') s.ten_chi_nhanh = r.ten_chi_nhanh ?? r.id_chi_nhanh ?? '—'; }
  for (const r of dbdtList) { const s = ensure(r.ngay, r.id_chi_nhanh, r.ten_chi_nhanh); s.dbdt = r; if (s.ten_chi_nhanh === '—') s.ten_chi_nhanh = r.ten_chi_nhanh ?? r.id_chi_nhanh ?? '—'; }

  return [...rowMap.entries()]
    .map(([key, v]) => ({
      key,
      ngay: v.ngay,
      id_chi_nhanh: v.id_chi_nhanh,
      ten_chi_nhanh: v.ten_chi_nhanh,
      bcnc: v.bcnc,
      bcsc: v.bcsc,
      dbdt: v.dbdt,
      bcncSnapshot: v.bcnc ? buildBcncSnapshot(v.bcnc) : null,
      kpiSnapshot: v.bcsc ? buildKpiSnapshot(v.bcsc, v.bcnc, v.dbdt) : null,
      dbdtKpi: v.dbdt ? computeDuBaoSlDongThungKpiFromFarm(v.dbdt) : null,
    }))
    .sort((a, b) => b.ngay.localeCompare(a.ngay) || a.ten_chi_nhanh.localeCompare(b.ten_chi_nhanh));
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export function filterThongKeSanXuatRows(
  rows: ThongKeSanXuatRow[],
  f: ThongKeSanXuatFilters
): ThongKeSanXuatRow[] {
  return rows.filter((row) => {
    if (f.dateFrom && row.ngay < f.dateFrom) return false;
    if (f.dateTo && row.ngay > f.dateTo) return false;
    if (f.chiNhanhIds.length > 0 && !f.chiNhanhIds.includes(row.id_chi_nhanh)) return false;

    // Hiển thị (OR logic)
    if (f.hienThiFilter.length > 0) {
      const hasDu3 = !!(row.bcnc && row.bcsc && row.dbdt);
      const matchDu3 = f.hienThiFilter.includes('du_3bc') && hasDu3;
      const matchThieu = f.hienThiFilter.includes('thieu_bc') && !hasDu3;
      if (!matchDu3 && !matchThieu) return false;
    }

    // KPI (OR logic)
    if (f.kpiFilter.length > 0) {
      const dat = row.kpiSnapshot?.tatCaKpiDat;
      const matchDat = f.kpiFilter.includes('dat') && dat === true;
      const matchKhong = f.kpiFilter.includes('khong_dat') && dat === false;
      if (!matchDat && !matchKhong) return false;
    }

    // Trạng thái BCNC
    if (f.trangThaiBcncFilter.length > 0 && row.bcnc) {
      if (!f.trangThaiBcncFilter.includes(row.bcnc.trang_thai)) return false;
    }

    // Trạng thái BCSC
    if (f.trangThaiBcscFilter.length > 0 && row.bcsc) {
      if (!f.trangThaiBcscFilter.includes(row.bcsc.trang_thai)) return false;
    }

    return true;
  });
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function computeThongKeSanXuatSummary(rows: ThongKeSanXuatRow[]): ThongKeSanXuatSummary {
  const tongNgay = rows.length;
  const ngayDu3Bc = rows.filter((r) => r.bcnc && r.bcsc && r.dbdt).length;
  const bcncRows = rows.filter((r) => r.bcncSnapshot);
  const bcscRows = rows.filter((r) => r.bcsc);
  const ngayCoBcsc = bcscRows.length;
  const ngayDatKpi = rows.filter((r) => r.kpiSnapshot?.tatCaKpiDat).length;
  const tongCongQuyDoi = bcncRows.reduce((s, r) => s + (r.bcncSnapshot?.tongCongQuyDoi ?? 0), 0);
  const tongGioTangCaTich = bcncRows.reduce((s, r) => s + (r.bcncSnapshot?.tongGioTangCaTich ?? 0), 0);
  const tongCnDinhBien = bcncRows.reduce((s, r) => s + (r.bcncSnapshot?.cnDinhBien ?? 0), 0);
  const validKRows = bcncRows.filter((r) => r.bcncSnapshot?.kDinhBien != null);
  const sumKDinhBien = validKRows.reduce((s, r) => s + (r.bcncSnapshot?.kDinhBien ?? 0), 0);
  const tongTienThuong = rows.reduce((s, r) => s + (r.kpiSnapshot?.tongTienThuong ?? 0), 0);
  const tongBuongSoChe = bcscRows.reduce((s, r) => s + num(r.bcsc?.tong_buong_so_che), 0);
  const tongSoThungTT = rows.reduce((s, r) => s + (r.dbdtKpi?.tong_so_thung_thuc_te ?? 0), 0);
  return {
    tongNgay, ngayDu3Bc, tongCongQuyDoi,
    tbCongQuyDoiNgay: bcncRows.length > 0 ? tongCongQuyDoi / bcncRows.length : null,
    tongGioTangCaTich,
    tbGioTangCaNgay: bcncRows.length > 0 ? tongGioTangCaTich / bcncRows.length : null,
    tbCnDinhBien: bcncRows.length > 0 ? tongCnDinhBien / bcncRows.length : null,
    tbKDinhBien: validKRows.length > 0 ? sumKDinhBien / validKRows.length : null,
    ngayCoBcsc, ngayDatKpi, tongTienThuong, tongBuongSoChe, tongSoThungTT,
  };
}

// ─── Date preset helpers ──────────────────────────────────────────────────────

const toIso = (d: Date) => d.toISOString().slice(0, 10);

import type { DateRangePreset } from '../../../../components/ui/DateRangePicker';

export const DATE_PRESETS: DateRangePreset[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'today', label: 'Hôm nay' },
  { id: '7days', label: '7 ngày' },
  { id: '30days', label: '30 ngày' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'last_month', label: 'Tháng trước' },
  { id: 'custom', label: 'Tuỳ chỉnh' },
];

export function resolveDateRange(presetId: string, customStart: string, customEnd: string): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
  switch (presetId) {
    case 'all': return { dateFrom: '', dateTo: '' };
    case 'today': return { dateFrom: toIso(today), dateTo: toIso(today) };
    case '7days': return { dateFrom: toIso(new Date(y, m, d - 6)), dateTo: toIso(today) };
    case '30days': return { dateFrom: toIso(new Date(y, m, d - 29)), dateTo: toIso(today) };
    case 'this_month': return { dateFrom: toIso(new Date(y, m, 1)), dateTo: toIso(new Date(y, m + 1, 0)) };
    case 'last_month': return { dateFrom: toIso(new Date(y, m - 1, 1)), dateTo: toIso(new Date(y, m, 0)) };
    case 'custom': return { dateFrom: customStart, dateTo: customEnd };
    default: return { dateFrom: '', dateTo: '' };
  }
}

export function defaultFilters(): ThongKeSanXuatFilters {
  return { datePreset: 'all', dateFrom: '', dateTo: '', chiNhanhIds: [], kpiFilter: [], hienThiFilter: [], trangThaiBcncFilter: [], trangThaiBcscFilter: [] };
}

/** Preset 'all' = mặc định, không tính là active filter. */
export function countActiveFilters(f: ThongKeSanXuatFilters): number {
  let n = 0;
  if (f.datePreset !== 'all') n++;
  if (f.chiNhanhIds.length > 0) n++;
  if (f.kpiFilter.length > 0) n++;
  if (f.hienThiFilter.length > 0) n++;
  if (f.trangThaiBcncFilter.length > 0) n++;
  if (f.trangThaiBcscFilter.length > 0) n++;
  return n;
}

export function getChiNhanhOptions(rows: ThongKeSanXuatRow[]): { id: string; ten: string }[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.id_chi_nhanh && !map.has(r.id_chi_nhanh)) map.set(r.id_chi_nhanh, r.ten_chi_nhanh || r.id_chi_nhanh);
  }
  return [...map.entries()].map(([id, ten]) => ({ id, ten })).sort((a, b) => a.ten.localeCompare(b.ten));
}
