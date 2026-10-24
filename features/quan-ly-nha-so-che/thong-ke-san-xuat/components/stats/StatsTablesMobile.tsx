import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../lib/utils';
import type { ByChiNhanhRow, KpiAnalysis } from './useThongKeSanXuatStats';
import { tongHopChiNhanh, tongHopSoCheThung } from './stats-totals';
import { buildKpiRows, fmt1, fmtCur, fmtCurSigned, fmtInt, fmtPct } from './stats-format';

/**
 * Phiên bản điện thoại của các bảng thống kê: mỗi dòng/chi nhánh là 1 thẻ,
 * dòng "Tổng cộng" là thẻ nổi bật đặt trên cùng. Không cuộn ngang.
 */

interface StatItem {
  label: string;
  value: string;
  cls?: string;
}

function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-2">
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">{it.label}</p>
          <p className={cn('text-sm font-semibold tabular-nums', it.cls)}>{it.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatCard({ title, titleCls, items }: { title: string; titleCls?: string; items: StatItem[] }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 space-y-2">
      <p className={cn('text-sm font-semibold text-foreground', titleCls)}>{title}</p>
      <StatGrid items={items} />
    </div>
  );
}

function TotalCard({ title, items }: { title: string; items: StatItem[] }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <StatGrid items={items} />
    </div>
  );
}

export function MobileStatsShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const POS = 'text-emerald-600 dark:text-emerald-400';
const NEG = 'text-red-500 dark:text-red-400';

const netCls = (v: number) => (v > 0 ? POS : v < 0 ? NEG : 'text-muted-foreground');

// ─── Tổng hợp theo chi nhánh ────────────────────────────────────────────────

export function ByChiNhanhCards({ rows }: { rows: ByChiNhanhRow[] }) {
  const { t } = useTranslation();
  const L = (k: string) => t(`thongKeSanXuat.mobile.stats.${k}`);

  if (rows.length === 0) {
    return <p className="px-1 py-4 text-center text-xs text-muted-foreground">{L('chuaCoDuLieu')}</p>;
  }

  const tot = tongHopChiNhanh(rows);
  return (
    <div className="space-y-2">
      {rows.length > 1 && (
        <TotalCard
          title={L('tongCong')}
          items={[
            { label: L('soNgay'), value: fmtInt(tot.tongNgay) },
            { label: L('congQDTong'), value: fmt1(tot.tongCongQD) },
            { label: L('gioTangCa'), value: tot.tongGioTC > 0 ? fmt1(tot.tongGioTC) : '—', cls: tot.tongGioTC > 0 ? 'text-orange-600 dark:text-orange-400' : undefined },
            { label: L('kpiDatCoBcsc'), value: tot.ngayCoBcsc > 0 ? `${tot.ngayDat}/${tot.ngayCoBcsc}` : '—' },
            { label: L('tyLeKpi'), value: fmtPct(tot.kpiRate) },
            { label: L('tienThuong'), value: tot.tienThuongDuong > 0 ? fmtCur(tot.tienThuongDuong) : '—', cls: POS },
            { label: L('tienPhat'), value: tot.tienThuongAm < 0 ? fmtCur(Math.abs(tot.tienThuongAm)) : '—', cls: NEG },
            { label: L('net'), value: tot.net !== 0 ? fmtCurSigned(tot.net) : '—', cls: netCls(tot.net) },
          ]}
        />
      )}
      {rows.map((r) => (
        <StatCard
          key={r.id}
          title={r.ten}
          items={[
            { label: L('soNgay'), value: fmtInt(r.tongNgay) },
            { label: L('congQDTong'), value: fmt1(r.tongCongQuyDoi) },
            { label: L('congQDTbNgay'), value: fmt1(r.tbCongQuyDoiNgay) },
            { label: L('gioTangCa'), value: r.tongGioTangCaTich > 0 ? fmt1(r.tongGioTangCaTich) : '—', cls: r.tongGioTangCaTich > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground' },
            { label: L('kpiDatCoBcsc'), value: r.ngayCoBcsc > 0 ? `${r.ngayDatKpi}/${r.ngayCoBcsc}` : '—' },
            {
              label: L('tyLeKpi'),
              value: fmtPct(r.kpiRate),
              cls: r.kpiRate != null ? (r.kpiRate >= 80 ? POS : r.kpiRate < 50 ? 'text-red-500' : undefined) : undefined,
            },
            { label: L('tienThuong'), value: r.tienThuongDuong > 0 ? fmtCur(r.tienThuongDuong) : '—', cls: POS },
            { label: L('tienPhat'), value: r.tienThuongAm < 0 ? fmtCur(Math.abs(r.tienThuongAm)) : '—', cls: NEG },
            { label: L('net'), value: r.tongTienThuong !== 0 ? fmtCurSigned(r.tongTienThuong) : '—', cls: netCls(r.tongTienThuong) },
          ]}
        />
      ))}
    </div>
  );
}

// ─── KPI & Thưởng / Phạt ────────────────────────────────────────────────────

export function KpiAnalysisCards({ a }: { a: KpiAnalysis }) {
  const { t } = useTranslation();
  const L = (k: string) => t(`thongKeSanXuat.mobile.stats.${k}`);
  const rows = buildKpiRows(a);
  const netCard = a.tienThuongNet;

  return (
    <div className="space-y-2">
      <TotalCard
        title={L('tongCong')}
        items={[
          { label: L('soNgay'), value: fmtInt(a.tongNgayCoBcsc + a.ngayKhongCoBcsc) },
          { label: L('tienThuongCong'), value: a.tienThuongDuong > 0 ? fmtCurSigned(a.tienThuongDuong) : '—', cls: POS },
          { label: L('tienPhatTru'), value: a.tienThuongAm < 0 ? fmtCurSigned(a.tienThuongAm) : '—', cls: NEG },
          { label: L('net'), value: netCard !== 0 ? fmtCurSigned(netCard) : '—', cls: netCls(netCard) },
        ]}
      />
      {rows.map((r) => (
        <StatCard
          key={r.label}
          title={r.label}
          titleCls={r.cls}
          items={[
            { label: L('soNgay'), value: fmtInt(r.count) },
            { label: L('tyLe'), value: r.pct, cls: 'text-muted-foreground' },
            { label: L('net'), value: r.net, cls: r.net.startsWith('+') ? POS : r.net.startsWith('-') ? 'text-red-500' : 'text-muted-foreground' },
            { label: L('tienThuongCong'), value: r.tienThuong, cls: POS },
            { label: L('tienPhatTru'), value: r.tienPhat, cls: NEG },
          ]}
        />
      ))}
    </div>
  );
}

// ─── Sơ chế & Đóng thùng ────────────────────────────────────────────────────

export function SoCheThungCards({ rows }: { rows: ByChiNhanhRow[] }) {
  const { t } = useTranslation();
  const L = (k: string) => t(`thongKeSanXuat.mobile.stats.${k}`);
  const tot = tongHopSoCheThung(rows);
  const dash = (v: number) => (v > 0 ? fmtInt(v) : '—');

  return (
    <div className="space-y-2">
      {rows.length > 1 && (
        <TotalCard
          title={L('tongCong')}
          items={[
            { label: L('buongSoChe'), value: dash(tot.tongBuongSoChe) },
            { label: L('thungKH'), value: dash(tot.tongThungKH) },
            { label: L('thungTT'), value: dash(tot.tongThungTT), cls: 'text-indigo-600 dark:text-indigo-400' },
            { label: L('tyLeTTKH'), value: fmtPct(tot.tyLeTTKH) },
          ]}
        />
      )}
      {rows.map((r) => (
        <StatCard
          key={r.id}
          title={r.ten}
          items={[
            { label: L('buongSoChe'), value: dash(r.tongBuongSoChe) },
            { label: L('thungKH'), value: dash(r.tongThungKH) },
            { label: L('thungTT'), value: dash(r.tongThungTT), cls: 'text-indigo-600 dark:text-indigo-400' },
            {
              label: L('tyLeTTKH'),
              value: r.tongThungKH > 0 ? fmtPct((r.tongThungTT / r.tongThungKH) * 100) : '—',
              cls: r.tongThungKH > 0 && r.tongThungTT >= r.tongThungKH ? POS : undefined,
            },
          ]}
        />
      ))}
    </div>
  );
}
