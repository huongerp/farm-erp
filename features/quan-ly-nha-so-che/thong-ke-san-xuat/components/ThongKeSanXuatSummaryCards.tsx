import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Clock,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  Banknote,
  Layers,
  Package,
  Calendar,
  FileCheck2,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { formatNumberVN } from '../../../../lib/utils';
import type { ThongKeSanXuatSummary } from '../core/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number | null, d = 1) =>
  v == null ? '—' : formatNumberVN(v, { maxFractionDigits: d, minFractionDigits: 0 });
const fmtInt = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });
const fmtCur = (v: number) =>
  v === 0
    ? '0đ'
    : v >= 1_000_000
    ? `${formatNumberVN(v / 1_000_000, { maxFractionDigits: 1 })}tr`
    : `${fmtInt(v)}đ`;

// ─── Card (exact danh-muc-tai-san style) ─────────────────────────────────────

interface CardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  /** Border class (and optional very-light bg tint). Defaults to neutral. */
  cardBorder?: string;
  iconBg: string;
  iconColor: string;
  labelColor: string;
  valueColor: string;
}

function Card({
  title, value, sub, icon: Icon,
  cardBorder = 'border-border',
  iconBg, iconColor, labelColor, valueColor,
}: CardProps) {
  return (
    <div className={`bg-card rounded-lg border p-2.5 sm:p-3 transition-all hover:shadow-sm ${cardBorder}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={15} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-2xs truncate ${labelColor}`}>{title}</p>
          <p className={`text-lg font-bold tabular-nums mt-0.5 leading-tight ${valueColor}`}>{value}</p>
          {sub && <p className={`text-2xs mt-0.5 truncate ${labelColor}`}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Preset colour helpers ────────────────────────────────────────────────────

const NEUTRAL = {
  cardBorder: 'border-border',
  iconBg:     'bg-muted/80',
  iconColor:  'text-muted-foreground',
  labelColor: 'text-muted-foreground',
  valueColor: 'text-foreground',
};
const PRIMARY = {
  cardBorder: 'border-primary/20 bg-primary/5',
  iconBg:     'bg-primary/10',
  iconColor:  'text-primary',
  labelColor: 'text-primary',
  valueColor: 'text-primary',
};
const color = (c: string) => ({
  cardBorder: `border-${c}-200 dark:border-${c}-800`,
  iconBg:     `bg-${c}-100 dark:bg-${c}-900/50`,
  iconColor:  `text-${c}-600 dark:text-${c}-400`,
  labelColor: `text-${c}-700 dark:text-${c}-400`,
  valueColor: `text-${c}-700 dark:text-${c}-300`,
});
const EMERALD = color('emerald');
const BLUE    = color('blue');
const ORANGE  = color('orange');
const AMBER   = color('amber');
const CYAN    = color('cyan');
const VIOLET  = color('violet');
const SKY     = color('sky');
const INDIGO  = color('indigo');

// ─── Section header (icon + label + divider line) ────────────────────────────

function SectionHeader({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-5 h-5 rounded bg-muted/60 flex items-center justify-center shrink-0">
        <Icon size={11} className="text-muted-foreground" />
      </div>
      <span className="text-xs font-semibold text-foreground/80 shrink-0">{children}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  summary: ThongKeSanXuatSummary;
}

const ThongKeSanXuatSummaryCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();

  const kpiPct =
    summary.ngayCoBcsc > 0
      ? Math.round((summary.ngayDatKpi / summary.ngayCoBcsc) * 100)
      : null;
  const du3BcPct =
    summary.tongNgay > 0
      ? Math.round((summary.ngayDu3Bc / summary.tongNgay) * 100)
      : null;

  return (
    <div className="space-y-4">

      {/* ── Section 1: Tổng quan ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card
          {...PRIMARY}
          icon={Calendar}
          title={t('thongKeSanXuat.card.tongNgay')}
          value={fmtInt(summary.tongNgay)}
          sub={summary.tongNgay > 0 ? `${summary.ngayDu3Bc} ngày đủ 3 BC` : undefined}
        />
        <Card
          {...(du3BcPct != null && du3BcPct >= 80 ? EMERALD : NEUTRAL)}
          icon={FileCheck2}
          title="Đủ 3 báo cáo"
          value={`${summary.ngayDu3Bc}/${summary.tongNgay}`}
          sub={du3BcPct != null ? `${du3BcPct}% tổng ngày` : undefined}
        />
        <Card
          {...(kpiPct != null && kpiPct >= 80 ? EMERALD : AMBER)}
          icon={CheckCircle2}
          title={t('thongKeSanXuat.card.ngayDatKpi')}
          value={`${summary.ngayDatKpi}/${summary.ngayCoBcsc}`}
          sub={kpiPct != null ? `${kpiPct}% ngày có BCSC` : undefined}
        />
        <Card
          {...(summary.tongTienThuong > 0 ? EMERALD : NEUTRAL)}
          icon={Banknote}
          title={t('thongKeSanXuat.card.tongTienThuong')}
          value={fmtCur(summary.tongTienThuong)}
          sub="Tiền thưởng KPI net"
        />
      </div>

      {/* ── Section 2: Nhân công ─────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={Users}>{t('thongKeSanXuat.table.groupNhanCong')}</SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Card
            {...BLUE}
            icon={Users}
            title={t('thongKeSanXuat.card.tongCongQuyDoi')}
            value={fmt(summary.tongCongQuyDoi, 1)}
            sub={summary.tbCongQuyDoiNgay != null ? `TB ${fmt(summary.tbCongQuyDoiNgay, 1)}/ngày` : undefined}
          />
          <Card
            {...ORANGE}
            icon={Clock}
            title={t('thongKeSanXuat.card.tongGioTangCa')}
            value={`${fmt(summary.tongGioTangCaTich, 1)}h`}
            sub={summary.tbGioTangCaNgay != null ? `TB ${fmt(summary.tbGioTangCaNgay, 1)}h/ngày` : undefined}
          />
          <Card
            {...CYAN}
            icon={UserCheck}
            title={t('thongKeSanXuat.card.tbCnDinhBien')}
            value={fmt(summary.tbCnDinhBien, 1)}
            sub="TB nhân sự định biên / ngày"
          />
          <Card
            {...VIOLET}
            icon={TrendingUp}
            title={t('thongKeSanXuat.card.tbKDinhBien')}
            value={fmt(summary.tbKDinhBien, 2)}
            sub="CN sản xuất / CN định biên"
          />
        </div>
      </div>

      {/* ── Section 3: Sơ chế & Đóng thùng ─────────────────────────────── */}
      <div>
        <SectionHeader icon={Layers}>
          {t('thongKeSanXuat.table.groupSoChe')} · {t('thongKeSanXuat.table.groupDongThung')}
        </SectionHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Card
            {...NEUTRAL}
            icon={ClipboardList}
            title="Ngày có báo cáo sơ chế"
            value={fmtInt(summary.ngayCoBcsc)}
            sub={summary.tongNgay > 0 ? `${Math.round((summary.ngayCoBcsc / summary.tongNgay) * 100)}% tổng ngày` : undefined}
          />
          <Card
            {...SKY}
            icon={Layers}
            title={t('thongKeSanXuat.card.tongBuongSoChe')}
            value={fmtInt(summary.tongBuongSoChe)}
            sub="Tổng buồng sơ chế"
          />
          <Card
            {...NEUTRAL}
            icon={BarChart3}
            title="Ngày có dự báo đóng thùng"
            value={fmtInt(summary.ngayDu3Bc)}
            sub={summary.tongNgay > 0 ? `${Math.round((summary.ngayDu3Bc / summary.tongNgay) * 100)}% tổng ngày` : undefined}
          />
          <Card
            {...INDIGO}
            icon={Package}
            title={t('thongKeSanXuat.card.tongThungTT')}
            value={fmtInt(summary.tongSoThungTT)}
            sub="Thùng đóng gói thực tế"
          />
        </div>
      </div>

    </div>
  );
};

export default ThongKeSanXuatSummaryCards;
