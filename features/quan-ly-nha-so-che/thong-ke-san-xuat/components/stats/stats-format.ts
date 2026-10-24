import { formatNumberVN } from '../../../../../lib/utils';
import type { KpiAnalysis } from './useThongKeSanXuatStats';

export const fmt1 = (v: number | null) =>
  v == null ? '—' : formatNumberVN(v, { maxFractionDigits: 1, minFractionDigits: 0 });
export const fmtInt = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });
export const fmtCur = (v: number) =>
  v === 0 ? '—' : v >= 1_000_000 ? `${formatNumberVN(v / 1_000_000, { maxFractionDigits: 1 })}tr` : fmtInt(v);
export const fmtCurSigned = (v: number) => {
  if (v === 0) return '—';
  const abs = Math.abs(v);
  const s = abs >= 1_000_000 ? `${formatNumberVN(abs / 1_000_000, { maxFractionDigits: 1 })}tr` : fmtInt(abs);
  return v > 0 ? `+${s}` : `-${s}`;
};
export const fmtPct = (v: number | null) =>
  v == null ? '—' : `${formatNumberVN(v, { maxFractionDigits: 0 })}%`;

export interface KpiAnalysisRow {
  label: string;
  count: number;
  pct: string;
  tienThuong: string;
  tienPhat: string;
  net: string;
  cls: string;
}

/** 3 dòng của bảng "Phân tích KPI & Thưởng / Phạt" (đã định dạng) — dùng chung bảng desktop và thẻ mobile. */
export function buildKpiRows(a: KpiAnalysis): KpiAnalysisRow[] {
  return [
    {
      label: 'Ngày đạt đủ KPI',
      count: a.ngayDatKpi,
      pct: a.tongNgayCoBcsc > 0 ? fmtPct((a.ngayDatKpi / a.tongNgayCoBcsc) * 100) : '—',
      tienThuong: a.tienThuongTrenNgayDat != null && a.tienThuongTrenNgayDat > 0 ? fmtCur(a.tienThuongTrenNgayDat) : '—',
      tienPhat: '—',
      net: a.tienThuongTrenNgayDat != null ? fmtCurSigned(a.tienThuongTrenNgayDat) : '—',
      cls: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Ngày chưa đạt KPI (có BCSC)',
      count: a.ngayKhongDatKpi,
      pct: a.tongNgayCoBcsc > 0 ? fmtPct((a.ngayKhongDatKpi / a.tongNgayCoBcsc) * 100) : '—',
      tienThuong: '—',
      tienPhat: a.tienPhatTrenNgayKhongDat != null && a.tienPhatTrenNgayKhongDat < 0 ? fmtCur(Math.abs(a.tienPhatTrenNgayKhongDat)) : '—',
      net: a.tienPhatTrenNgayKhongDat != null && a.tienPhatTrenNgayKhongDat !== 0 ? fmtCurSigned(a.tienPhatTrenNgayKhongDat) : '—',
      cls: 'text-red-500 dark:text-red-400',
    },
    {
      label: 'Ngày không có BC sơ chế',
      count: a.ngayKhongCoBcsc,
      pct: '—',
      tienThuong: '—',
      tienPhat: '—',
      net: '—',
      cls: 'text-muted-foreground',
    },
  ];
}
