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
  /** Net cả 4 nhóm thưởng (KPI kể cả phạt + QL + nhóm tỉa + nhóm CP). */
  tongTienThuong: number;
  /** Phần dương / âm của cột Tiền thưởng KPI (`tien_thuong`). */
  tienThuongDuong: number;
  tienThuongAm: number;
  tongThuongQl: number;
  tongThuongNhomTia: number;
  tongThuongNhomCp: number;
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

/** Tổng 4 nhóm thưởng của một tập ngày. `kpi` = cột Tiền thưởng KPI (âm là phạt). */
export interface TongThuongNhom {
  kpi: number;
  /** Phần dương / âm của `tien_thuong` cộng theo TỪNG dòng KPI (khớp cách tách ở dòng Tổng). */
  duong: number;
  am: number;
  ql: number;
  nhomTia: number;
  nhomCp: number;
  /** kpi + ql + nhomTia + nhomCp */
  net: number;
}

export interface KpiAnalysis {
  tongNgayCoBcsc: number;
  ngayDatKpi: number;
  ngayKhongDatKpi: number;
  ngayKhongCoBcsc: number;
  /** Phần dương / âm của cột Tiền thưởng KPI trên mọi ngày. */
  tienThuongDuong: number;
  tienThuongAm: number;
  /** Tổng 3 nhóm thưởng nhập tay trên mọi ngày. */
  thuongQl: number;
  thuongNhomTia: number;
  thuongNhomCp: number;
  /** Net cả 4 nhóm trên mọi ngày. */
  tienThuongNet: number;
  /** 4 nhóm trên các ngày đạt đủ KPI / chưa đạt (có BCSC). */
  nhomNgayDat: TongThuongNhom;
  nhomNgayKhongDat: TongThuongNhom;
  /** Net 4 nhóm trên ngày đạt; null khi không có ngày đạt. */
  tienThuongTrenNgayDat: number | null;
  /** Net 4 nhóm trên ngày chưa đạt; null khi không có ngày chưa đạt. */
  tienPhatTrenNgayKhongDat: number | null;
}

/** Cộng 4 nhóm thưởng từ `kpiSnapshot` của các ngày. */
export function tongThuongNhom(rows: ThongKeSanXuatRow[]): TongThuongNhom {
  const t: TongThuongNhom = { kpi: 0, duong: 0, am: 0, ql: 0, nhomTia: 0, nhomCp: 0, net: 0 };
  for (const r of rows) {
    const k = r.kpiSnapshot;
    if (!k) continue;
    t.kpi += k.tongTienThuong;
    for (const kr of k.rows) {
      const v = Number(kr.tien_thuong ?? 0);
      if (v > 0) t.duong += v;
      else if (v < 0) t.am += v;
    }
    t.ql += k.tongThuongQl;
    t.nhomTia += k.tongThuongNhomTia;
    t.nhomCp += k.tongThuongNhomCp;
    t.net += k.tongThuongNet;
  }
  return t;
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
          tongThuongQl: 0, tongThuongNhomTia: 0, tongThuongNhomCp: 0,
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
      const ql = row.kpiSnapshot?.tongThuongQl ?? 0;
      const nhomTia = row.kpiSnapshot?.tongThuongNhomTia ?? 0;
      const nhomCp = row.kpiSnapshot?.tongThuongNhomCp ?? 0;
      b.tienThuongDuong += duong;
      b.tienThuongAm += am;
      b.tongThuongQl += ql;
      b.tongThuongNhomTia += nhomTia;
      b.tongThuongNhomCp += nhomCp;
      b.tongTienThuong += duong + am + ql + nhomTia + nhomCp;
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
    const tatCa = tongThuongNhom(filteredRows);
    const nhomNgayDat = tongThuongNhom(filteredRows.filter((r) => r.kpiSnapshot?.tatCaKpiDat === true));
    const nhomNgayKhongDat = tongThuongNhom(filteredRows.filter((r) => r.bcsc && r.kpiSnapshot?.tatCaKpiDat === false));

    const kpiAnalysis: KpiAnalysis = {
      tongNgayCoBcsc: bcscRows.length,
      ngayDatKpi, ngayKhongDatKpi, ngayKhongCoBcsc,
      tienThuongDuong, tienThuongAm,
      thuongQl: tatCa.ql, thuongNhomTia: tatCa.nhomTia, thuongNhomCp: tatCa.nhomCp,
      tienThuongNet: tienThuongDuong + tienThuongAm + tatCa.ql + tatCa.nhomTia + tatCa.nhomCp,
      nhomNgayDat, nhomNgayKhongDat,
      tienThuongTrenNgayDat: ngayDatKpi > 0 ? nhomNgayDat.net : null,
      tienPhatTrenNgayKhongDat: ngayKhongDatKpi > 0 ? nhomNgayKhongDat.net : null,
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
