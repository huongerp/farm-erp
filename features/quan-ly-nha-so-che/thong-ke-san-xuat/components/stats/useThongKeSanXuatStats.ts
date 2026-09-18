import { useMemo } from 'react';
import { formatNumberVN } from '../../../../../lib/utils';
import type { ThongKeSanXuatRow } from '../../core/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ByChiNhanhRow {
  id: string;
  ten: string;
  tongNgay: number;
  ngayCoBcnc: number;
  ngayCoBcsc: number;
  ngayCoDbdt: number;
  tongCongQuyDoi: number;
  tbCongQuyDoiNgay: number | null;
  tongGioTangCaTich: number;
  ngayDatKpi: number;
  kpiRate: number | null;
  tongTienThuong: number;
  tienThuongDuong: number;
  tienThuongAm: number;
  tongBuongSoChe: number;
  tongThungKH: number;
  tongThungTT: number;
}

export interface KpiPieItem {
  name: string;
  value: number;
  fill: string;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface ChartItemGrouped {
  name: string;
  kh: number;
  tt: number;
}

export interface KpiAnalysis {
  tongNgayCoBcsc: number;
  ngayDatKpi: number;
  ngayKhongDatKpi: number;
  ngayKhongCoBcsc: number;
  tienThuongDuong: number;
  tienThuongAm: number;
  tienThuongNet: number;
  tienThuongTrenNgayDat: number | null;
  tienPhatTrenNgayKhongDat: number | null;
}

export interface ThongKeSanXuatStats {
  byChiNhanh: ByChiNhanhRow[];
  kpiPieData: KpiPieItem[];
  kpiAnalysis: KpiAnalysis;
  chartCongQD: ChartItem[];
  chartGioTC: ChartItem[];
  chartThung: ChartItemGrouped[];
  chartBuongSoChe: ChartItem[];
  bcStatusRows: { label: string; count: number; pct: string }[];
}

const fmtPct = (n: number, d: number) =>
  d > 0 ? `${formatNumberVN((n / d) * 100, { maxFractionDigits: 0 })}%` : '—';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useThongKeSanXuatStats(filteredRows: ThongKeSanXuatRow[]): ThongKeSanXuatStats {
  return useMemo(() => {
    const total = filteredRows.length;

    // ── By chi nhánh ────────────────────────────────────────────────────────
    const branchMap = new Map<string, ByChiNhanhRow>();
    for (const row of filteredRows) {
      const id = row.id_chi_nhanh || '__blank__';
      if (!branchMap.has(id)) {
        branchMap.set(id, {
          id, ten: row.ten_chi_nhanh || id,
          tongNgay: 0, ngayCoBcnc: 0, ngayCoBcsc: 0, ngayCoDbdt: 0,
          tongCongQuyDoi: 0, tbCongQuyDoiNgay: null, tongGioTangCaTich: 0,
          ngayDatKpi: 0, kpiRate: null,
          tongTienThuong: 0, tienThuongDuong: 0, tienThuongAm: 0,
          tongBuongSoChe: 0, tongThungKH: 0, tongThungTT: 0,
        });
      }
      const b = branchMap.get(id)!;
      b.tongNgay++;
      if (row.bcnc) { b.ngayCoBcnc++; b.tongCongQuyDoi += row.bcncSnapshot?.tongCongQuyDoi ?? 0; b.tongGioTangCaTich += row.bcncSnapshot?.tongGioTangCaTich ?? 0; }
      if (row.bcsc) { b.ngayCoBcsc++; b.tongBuongSoChe += Number(row.bcsc.tong_buong_so_che ?? 0); }
      if (row.dbdt) { b.ngayCoDbdt++; b.tongThungKH += row.dbdtKpi?.tong_so_thung_ke_hoach ?? 0; b.tongThungTT += row.dbdtKpi?.tong_so_thung_thuc_te ?? 0; }
      if (row.kpiSnapshot?.tatCaKpiDat) b.ngayDatKpi++;
      const kpiRows = row.kpiSnapshot?.rows ?? [];
      const duong = kpiRows.filter((k) => k.tien_thuong > 0).reduce((s, k) => s + k.tien_thuong, 0);
      const am = kpiRows.filter((k) => k.tien_thuong < 0).reduce((s, k) => s + k.tien_thuong, 0);
      b.tienThuongDuong += duong;
      b.tienThuongAm += am;
      b.tongTienThuong += duong + am;
    }
    const byChiNhanh = [...branchMap.values()].map((b) => ({
      ...b,
      tbCongQuyDoiNgay: b.ngayCoBcnc > 0 ? b.tongCongQuyDoi / b.ngayCoBcnc : null,
      kpiRate: b.ngayCoBcsc > 0 ? (b.ngayDatKpi / b.ngayCoBcsc) * 100 : null,
    })).sort((a, b) => b.tongCongQuyDoi - a.tongCongQuyDoi);

    // ── KPI analysis ─────────────────────────────────────────────────────────
    const bcscRows = filteredRows.filter((r) => r.bcsc);
    const ngayDatKpi = bcscRows.filter((r) => r.kpiSnapshot?.tatCaKpiDat === true).length;
    const ngayKhongDatKpi = bcscRows.filter((r) => r.kpiSnapshot?.tatCaKpiDat === false).length;
    const ngayKhongCoBcsc = filteredRows.filter((r) => !r.bcsc).length;
    let tienThuongDuong = 0, tienThuongAm = 0;
    for (const row of filteredRows) {
      for (const k of row.kpiSnapshot?.rows ?? []) {
        if (k.tien_thuong > 0) tienThuongDuong += k.tien_thuong;
        else if (k.tien_thuong < 0) tienThuongAm += k.tien_thuong;
      }
    }
    const thuongTrenNgayDat = filteredRows.filter((r) => r.kpiSnapshot?.tatCaKpiDat === true).reduce((s, r) => s + (r.kpiSnapshot?.tongTienThuong ?? 0), 0);
    const phatTrenNgayKhong = filteredRows.filter((r) => r.bcsc && r.kpiSnapshot?.tatCaKpiDat === false).reduce((s, r) => s + (r.kpiSnapshot?.tongTienThuong ?? 0), 0);

    const kpiAnalysis: KpiAnalysis = {
      tongNgayCoBcsc: bcscRows.length,
      ngayDatKpi, ngayKhongDatKpi, ngayKhongCoBcsc,
      tienThuongDuong, tienThuongAm, tienThuongNet: tienThuongDuong + tienThuongAm,
      tienThuongTrenNgayDat: ngayDatKpi > 0 ? thuongTrenNgayDat : null,
      tienPhatTrenNgayKhongDat: ngayKhongDatKpi > 0 ? phatTrenNgayKhong : null,
    };

    // ── KPI pie ──────────────────────────────────────────────────────────────
    const kpiPieData: KpiPieItem[] = [
      { name: 'Đạt đủ KPI', value: ngayDatKpi, fill: '#10b981' },
      { name: 'Còn không đạt', value: ngayKhongDatKpi, fill: '#ef4444' },
      { name: 'Không có BCSC', value: ngayKhongCoBcsc, fill: '#94a3b8' },
    ].filter((d) => d.value > 0);

    // ── Chart data (by chi nhánh) ─────────────────────────────────────────────
    const label = (b: ByChiNhanhRow) => b.ten.length > 12 ? b.ten.slice(0, 11) + '…' : b.ten;
    const chartCongQD: ChartItem[] = byChiNhanh.map((b) => ({ name: label(b), value: Math.round(b.tongCongQuyDoi * 10) / 10 }));
    const chartGioTC: ChartItem[] = byChiNhanh.filter((b) => b.tongGioTangCaTich > 0).map((b) => ({ name: label(b), value: Math.round(b.tongGioTangCaTich * 10) / 10 }));
    const chartThung: ChartItemGrouped[] = byChiNhanh.filter((b) => b.tongThungKH > 0 || b.tongThungTT > 0).map((b) => ({ name: label(b), kh: Math.round(b.tongThungKH), tt: Math.round(b.tongThungTT) }));
    const chartBuongSoChe: ChartItem[] = byChiNhanh.filter((b) => b.tongBuongSoChe > 0).map((b) => ({ name: label(b), value: Math.round(b.tongBuongSoChe) }));

    // ── BC status ─────────────────────────────────────────────────────────────
    const ngayDu3Bc = filteredRows.filter((r) => r.bcnc && r.bcsc && r.dbdt).length;
    const ngayCoBcnc = filteredRows.filter((r) => r.bcnc).length;
    const ngayCoBcscAll = filteredRows.filter((r) => r.bcsc).length;
    const ngayCoDbdt = filteredRows.filter((r) => r.dbdt).length;
    const bcStatusRows = [
      { label: 'Đủ cả 3 báo cáo', count: ngayDu3Bc, pct: fmtPct(ngayDu3Bc, total) },
      { label: 'Có báo cáo nhân công', count: ngayCoBcnc, pct: fmtPct(ngayCoBcnc, total) },
      { label: 'Có báo cáo sơ chế', count: ngayCoBcscAll, pct: fmtPct(ngayCoBcscAll, total) },
      { label: 'Có dự báo đóng thùng', count: ngayCoDbdt, pct: fmtPct(ngayCoDbdt, total) },
    ];

    return { byChiNhanh, kpiPieData, kpiAnalysis, chartCongQD, chartGioTC, chartThung, chartBuongSoChe, bcStatusRows };
  }, [filteredRows]);
}
