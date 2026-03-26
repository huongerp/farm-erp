import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useKeHoachChiPhiByNam, useThucChiTheoThang } from '../hooks/use-ke-hoach-chi-phi';
import { useKeHoachChiPhiStore } from '../store/useKeHoachChiPhiStore';
import { formatCurrency } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import type { KeHoachChiPhi } from '../core/types';
import { THANG_KEYS } from '../core/types';

const CARD_CLASS = 'bg-card rounded-xl border border-border p-4 transition-all';
const ICON_WRAP = 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/** Gộp danh sách dòng kế hoạch theo id_danh_muc (tổng 12 tháng). */
function aggregatePlanByDanhMuc(rows: KeHoachChiPhi[]): { id_danh_muc: string; ten_danh_muc: string; thang_1: number; thang_2: number; thang_3: number; thang_4: number; thang_5: number; thang_6: number; thang_7: number; thang_8: number; thang_9: number; thang_10: number; thang_11: number; thang_12: number; tong_nam: number }[] {
  const byDanhMuc = new Map<string, { ten_danh_muc: string; thang: Record<number, number> }>();
  for (const r of rows) {
    if (!byDanhMuc.has(r.id_danh_muc)) {
      byDanhMuc.set(r.id_danh_muc, {
        ten_danh_muc: r.ten_danh_muc,
        thang: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
      });
    }
    const entry = byDanhMuc.get(r.id_danh_muc)!;
    for (let m = 1; m <= 12; m++) {
      const key = THANG_KEYS[m - 1];
      entry.thang[m] = (entry.thang[m] ?? 0) + (Number(r[key]) || 0);
    }
  }
  const result: { id_danh_muc: string; ten_danh_muc: string; thang_1: number; thang_2: number; thang_3: number; thang_4: number; thang_5: number; thang_6: number; thang_7: number; thang_8: number; thang_9: number; thang_10: number; thang_11: number; thang_12: number; tong_nam: number }[] = [];
  byDanhMuc.forEach((v, id_danh_muc) => {
    const t = v.thang;
    const tong_nam = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, m) => s + (t[m] ?? 0), 0);
    result.push({
      id_danh_muc,
      ten_danh_muc: v.ten_danh_muc,
      thang_1: t[1] ?? 0,
      thang_2: t[2] ?? 0,
      thang_3: t[3] ?? 0,
      thang_4: t[4] ?? 0,
      thang_5: t[5] ?? 0,
      thang_6: t[6] ?? 0,
      thang_7: t[7] ?? 0,
      thang_8: t[8] ?? 0,
      thang_9: t[9] ?? 0,
      thang_10: t[10] ?? 0,
      thang_11: t[11] ?? 0,
      thang_12: t[12] ?? 0,
      tong_nam,
    });
  });
  return result;
}

const KeHoachChiPhiReportTab: React.FC = () => {
  const { t } = useTranslation();
  const { filters } = useKeHoachChiPhiStore();
  const { data: flatRows = [], isLoading: planLoading } = useKeHoachChiPhiByNam(filters.nam);
  const { data: actualRows = [], isLoading: actualLoading } = useThucChiTheoThang(filters.nam);
  const planRows = useMemo(() => aggregatePlanByDanhMuc(flatRows), [flatRows]);
  const isLoading = planLoading || actualLoading;

  const totals = useMemo(() => {
    const planTotal = planRows.reduce((s, r) => s + r.tong_nam, 0);
    const actualTotal = actualRows.reduce((s, r) => s + r.tong_nam, 0);
    const variance = actualTotal - planTotal;
    const pct = planTotal > 0 ? (actualTotal / planTotal) * 100 : 0;
    return { planTotal, actualTotal, variance, pct };
  }, [planRows, actualRows]);

  const byMonthChart = useMemo(() => {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    return months.map((m) => {
      const planVal = planRows.reduce(
        (s, r) => s + ((r as Record<string, number>)[`thang_${m}`] ?? 0),
        0
      );
      const actualVal = actualRows.reduce(
        (s, r) => s + ((r as Record<string, number>)[`thang_${m}`] ?? 0),
        0
      );
      return {
        name: `T${m}`,
        [t('keHoachChiPhi.report.plan')]: planVal,
        [t('keHoachChiPhi.report.actual')]: actualVal,
      };
    });
  }, [planRows, actualRows, t]);

  const byCategoryPie = useMemo(() => {
    return actualRows
      .filter((r) => r.tong_nam > 0)
      .map((r, i) => ({
        name: r.ten_danh_muc,
        value: r.tong_nam,
        color: COLORS[i % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [actualRows]);

  const topOverrun = useMemo(() => {
    return planRows
      .map((p) => {
        const actual = actualRows.find((a) => a.id_danh_muc === p.id_danh_muc);
        const actualTotal = actual?.tong_nam ?? 0;
        const variance = actualTotal - p.tong_nam;
        return {
          ten_danh_muc: p.ten_danh_muc,
          ke_hoach: p.tong_nam,
          thuc_chi: actualTotal,
          variance,
          pct: p.tong_nam > 0 ? (actualTotal / p.tong_nam) * 100 : 0,
        };
      })
      .filter((x) => x.variance > 0)
      .sort((a, b) => b.variance - a.variance)
      .slice(0, 5);
  }, [planRows, actualRows]);

  const cards = [
    {
      labelKey: 'keHoachChiPhi.report.tongKeHoach',
      value: totals.planTotal,
      icon: BarChart3,
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      labelKey: 'keHoachChiPhi.report.tongThucChi',
      value: totals.actualTotal,
      icon: Wallet,
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      labelKey: 'keHoachChiPhi.report.chenhLech',
      value: totals.variance,
      icon: TrendingUp,
      iconClass: totals.variance > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      labelKey: 'keHoachChiPhi.report.phanTramHoanThanh',
      value: `${totals.pct.toFixed(1)}%`,
      icon: totals.pct > 100 ? AlertTriangle : BarChart3,
      iconClass: totals.pct > 100 ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div className="h-5 w-48 rounded bg-muted/60 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={CARD_CLASS}>
                <div className="flex items-center gap-3">
                  <div className={cn(ICON_WRAP, 'bg-muted/60 animate-pulse')} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
                    <div className="h-6 w-24 rounded bg-muted/60 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={CARD_CLASS}>
            <div className="h-4 w-40 rounded bg-muted/60 animate-pulse mb-4" />
            <div className="h-[280px] w-full rounded-lg bg-muted/40 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={CARD_CLASS}>
              <div className="h-4 w-36 rounded bg-muted/60 animate-pulse mb-4" />
              <div className="h-[260px] w-full rounded-lg bg-muted/40 animate-pulse" />
            </div>
            <div className={CARD_CLASS}>
              <div className="h-4 w-44 rounded bg-muted/60 animate-pulse mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="h-4 flex-1 max-w-[120px] rounded bg-muted/60 animate-pulse" />
                    <div className="h-4 w-24 rounded bg-muted/60 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <p className="text-sm text-muted-foreground">
          {t('keHoachChiPhi.reportTabDesc')} — {filters.nam}
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((item) => {
            const Icon = item.icon;
            const isNum = typeof item.value === 'number';
            return (
              <div key={item.labelKey} className={CARD_CLASS}>
                <div className="flex items-center gap-3">
                  <div className={cn(ICON_WRAP, item.iconClass)}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{t(item.labelKey)}</p>
                    <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                      {isNum ? formatCurrency(item.value as number) : item.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {byMonthChart.some((d) => d[t('keHoachChiPhi.report.plan')] > 0 || d[t('keHoachChiPhi.report.actual')] > 0) && (
          <div className={CARD_CLASS}>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {t('keHoachChiPhi.report.chartByMonth')}
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonthChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey={t('keHoachChiPhi.report.plan')} fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={t('keHoachChiPhi.report.actual')} fill="var(--color-emerald-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {byCategoryPie.length > 0 && (
            <div className={CARD_CLASS}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {t('keHoachChiPhi.report.pieByCategory')}
              </h3>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategoryPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {byCategoryPie.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {topOverrun.length > 0 && (
            <div className={CARD_CLASS}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {t('keHoachChiPhi.report.topOverrun')}
              </h3>
              <div className="space-y-2">
                {topOverrun.map((row) => (
                  <div
                    key={row.ten_danh_muc}
                    className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium text-foreground truncate">{row.ten_danh_muc}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(row.thuc_chi)} / {formatCurrency(row.ke_hoach)}
                      </span>
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                        +{row.pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeHoachChiPhiReportTab;
