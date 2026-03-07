import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Send,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Inbox,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import DateRangePicker from '../../../components/ui/DateRangePicker';
import LoadingSpinnerWithText from '../../../components/shared/LoadingSpinnerWithText';
import { formatCurrency, cn } from '../../../lib/utils';
import { DATE_RANGE_PRESETS } from '../thu-chi/core/stats-constants';
import type { DateRangePresetId } from '../thu-chi/core/stats-constants';
import { getDateRangeFromPreset, toYYYYMMDD } from '../thu-chi/utils/stats-date-range';
import { useThuChiStatsByLoai, useThuChiList } from '../thu-chi/hooks/use-thu-chi';
import { useTaiKhoan } from '../tai-khoan/hooks/use-tai-khoan';
import { useDeXuatChiPhiList } from '../de-xuat-chi-phi/hooks/use-de-xuat-chi-phi';
import { useKeHoachChiPhiByNam, useThucChiTheoThang } from '../ke-hoach-chi-phi/hooks/use-ke-hoach-chi-phi';
import type { KeHoachChiPhi } from '../ke-hoach-chi-phi/core/types';
import StatsToolbar from './components/StatsToolbar';
import Tooltip from '../../../components/ui/Tooltip';
import { CHART_HEIGHT, CHART_COLORS } from './core/constants';

function getTongTienDeXuat(chiTiet: { so_tien?: number }[] | undefined): number {
  if (!chiTiet?.length) return 0;
  return chiTiet.reduce((s, d) => s + (d.so_tien ?? 0), 0);
}

function aggregatePlanByDanhMuc(rows: KeHoachChiPhi[]): { id_danh_muc: string; ten_danh_muc: string; tong_nam: number }[] {
  const byDanhMuc = new Map<string, { ten_danh_muc: string; tong_nam: number }>();
  for (const r of rows) {
    const cur = byDanhMuc.get(r.id_danh_muc);
    if (!cur) {
      byDanhMuc.set(r.id_danh_muc, { ten_danh_muc: r.ten_danh_muc, tong_nam: r.tong_nam ?? 0 });
    } else {
      cur.tong_nam += r.tong_nam ?? 0;
    }
  }
  return Array.from(byDanhMuc.entries()).map(([id_danh_muc, v]) => ({
    id_danh_muc,
    ten_danh_muc: v.ten_danh_muc,
    tong_nam: v.tong_nam,
  }));
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const KPI_IDS = ['tongThu', 'tongChi', 'soDuTong', 'deXuatChoDuyet', 'planVsActual'] as const;
type KpiId = (typeof KPI_IDS)[number];

const BaoCaoTaiChinhPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePresetId>('this_year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [chartsVisible, setChartsVisible] = useState(false);
  const [visibleKpiIds, setVisibleKpiIds] = useState<Set<KpiId>>(() => new Set(KPI_IDS));
  const [kpiCustomizeOpen, setKpiCustomizeOpen] = useState(false);
  const kpiCustomizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kpiCustomizeOpen) return;
    const handler = (e: MouseEvent) => {
      if (kpiCustomizeRef.current && !kpiCustomizeRef.current.contains(e.target as Node)) setKpiCustomizeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [kpiCustomizeOpen]);

  const toggleKpiVisibility = useCallback((id: KpiId) => {
    setVisibleKpiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const dateRange = useMemo(
    () =>
      getDateRangeFromPreset(
        dateRangePreset,
        customStart ? new Date(customStart) : undefined,
        customEnd ? new Date(customEnd) : undefined
      ),
    [dateRangePreset, customStart, customEnd]
  );

  const tuNgay = toYYYYMMDD(dateRange.start);
  const denNgay = toYYYYMMDD(dateRange.end);

  const { data: byLoai = [], isLoading: loadingLoai } = useThuChiStatsByLoai(tuNgay, denNgay);
  const { data: taiKhoanList = [], isLoading: loadingTk } = useTaiKhoan();
  const { data: deXuatList = [], isLoading: loadingDx } = useDeXuatChiPhiList();
  const { data: planRows = [], isLoading: loadingPlan } = useKeHoachChiPhiByNam(year);
  const { data: actualRows = [], isLoading: loadingActual } = useThucChiTheoThang(year);
  const { data: thuChiList = [], isLoading: loadingThuChiList } = useThuChiList();

  const isLoading =
    loadingLoai ||
    loadingTk ||
    loadingDx ||
    loadingPlan ||
    loadingActual ||
    loadingThuChiList;

  const tongThuKy = useMemo(() => byLoai.find((r) => r.loai === 'thu')?.tong_tien ?? 0, [byLoai]);
  const tongChiKy = useMemo(() => byLoai.find((r) => r.loai === 'chi')?.tong_tien ?? 0, [byLoai]);
  const soDuTong = useMemo(
    () => taiKhoanList.reduce((s, a) => s + (a.so_du_hien_tai ?? 0), 0),
    [taiKhoanList]
  );

  const pendingDeXuat = useMemo(() => {
    const pending = deXuatList.filter((d) => d.trang_thai === 0);
    const count = pending.length;
    const tongTien = pending.reduce((s, d) => s + getTongTienDeXuat(d.chi_tiet), 0);
    return { count, tongTien };
  }, [deXuatList]);

  const planAggregated = useMemo(() => aggregatePlanByDanhMuc(planRows), [planRows]);
  const planTotal = useMemo(() => planAggregated.reduce((s, r) => s + r.tong_nam, 0), [planAggregated]);
  const actualTotal = useMemo(() => actualRows.reduce((s, r) => s + r.tong_nam, 0), [actualRows]);
  const planVsActualVariance = actualTotal - planTotal;
  const planVsActualPct = planTotal > 0 ? (actualTotal / planTotal) * 100 : 0;

  const thuChiByMonth = useMemo(() => {
    const byMonth: Record<number, { thu: number; chi: number }> = {};
    for (let m = 1; m <= 12; m++) byMonth[m] = { thu: 0, chi: 0 };
    thuChiList.forEach((g) => {
      const d = new Date(g.ngay_giao_dich);
      if (d.getFullYear() !== year || g.trang_thai !== 'hoan_thanh') return;
      const m = d.getMonth() + 1;
      if (g.loai === 'thu') byMonth[m].thu += g.so_tien;
      else if (g.loai === 'chi') byMonth[m].chi += g.so_tien;
    });
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
      name: `T${m}`,
      thu: byMonth[m].thu,
      chi: byMonth[m].chi,
    }));
  }, [thuChiList, year]);

  const planVsActualByMonth = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
      const planSum = planRows.reduce((s, p) => s + ((p as Record<string, number>)[`thang_${m}`] ?? 0), 0);
      const actualVal = actualRows.reduce((s, r) => s + ((r as Record<string, number>)[`thang_${m}`] ?? 0), 0);
      return {
        name: `T${m}`,
        [t('baoCaoTaiChinh.chart.plan')]: planSum,
        [t('baoCaoTaiChinh.chart.actual')]: actualVal,
      };
    });
  }, [planRows, actualRows, t]);

  const chiByDanhMucPie = useMemo(() => {
    return actualRows
      .filter((r) => r.tong_nam > 0)
      .map((r, i) => ({
        name: r.ten_danh_muc,
        value: r.tong_nam,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [actualRows]);

  const pendingDeXuatTop = useMemo(() => {
    return deXuatList
      .filter((d) => d.trang_thai === 0)
      .slice(0, 10)
      .map((d) => ({
        id: d.id,
        so_phieu: d.so_phieu,
        ten_nguoi_de_xuat: d.ten_nguoi_de_xuat,
        tong_tien: getTongTienDeXuat(d.chi_tiet),
        loai: d.loai,
      }));
  }, [deXuatList]);

  const activeFilterCount = dateRangePreset === 'custom' ? 1 : 0;
  const handleClearFilters = useCallback(() => {
    setDateRangePreset('this_year');
    setCustomStart('');
    setCustomEnd('');
  }, []);

  const handleExportReport = useCallback(
    async (_format: 'excel' | 'pdf') => {
      toast.info(t('baoCaoTaiChinh.stats.exportComingSoon'));
    },
    [t]
  );

  const handlePrintReport = useCallback(() => window.print(), []);

  useEffect(() => {
    const id = setTimeout(() => setChartsVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  const dateRangePickerPresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  const dateRangePicker = (
    <DateRangePicker
      presets={dateRangePickerPresets}
      value={{ preset: dateRangePreset, customStart, customEnd }}
      onChange={(v) => {
        setDateRangePreset(v.preset as DateRangePresetId);
        setCustomStart(v.customStart);
        setCustomEnd(v.customEnd);
      }}
      displayLabel={dateRange.label}
      placeholder={t('baoCaoTaiChinh.filterPeriod')}
    />
  );

  /** Chỉ 1 filter chip chọn thời gian (Kỳ). Năm dùng mặc định cho Kế hoạch vs Thực chi. */
  const renderFilters = dateRangePicker;
  const renderFiltersMobileRow2 = dateRangePicker;

  const kpis: { id: KpiId; label: string; value: string; sub?: string; icon: typeof Wallet; bg: string; color: string }[] = [
    {
      id: 'tongThu',
      label: t('baoCaoTaiChinh.kpi.tongThu'),
      value: formatCurrency(tongThuKy),
      icon: ArrowDownCircle,
      bg: 'bg-emerald-500/10',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'tongChi',
      label: t('baoCaoTaiChinh.kpi.tongChi'),
      value: formatCurrency(tongChiKy),
      icon: ArrowUpCircle,
      bg: 'bg-rose-500/10',
      color: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'soDuTong',
      label: t('baoCaoTaiChinh.kpi.soDuTong'),
      value: formatCurrency(soDuTong),
      icon: Wallet,
      bg: 'bg-primary/10',
      color: 'text-primary',
    },
    {
      id: 'deXuatChoDuyet',
      label: t('baoCaoTaiChinh.kpi.deXuatChoDuyet'),
      value: String(pendingDeXuat.count),
      sub: pendingDeXuat.tongTien > 0 ? formatCurrency(pendingDeXuat.tongTien) : undefined,
      icon: Send,
      bg: 'bg-amber-500/10',
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'planVsActual',
      label: t('baoCaoTaiChinh.kpi.planVsActual'),
      value: `${planVsActualPct.toFixed(0)}%`,
      sub: `${t('baoCaoTaiChinh.chart.plan')}: ${formatCurrency(planTotal)} · ${t('baoCaoTaiChinh.chart.actual')}: ${formatCurrency(actualTotal)}`,
      icon: BarChart3,
      bg: planVsActualVariance <= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      color: planVsActualVariance <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    },
  ];

  const visibleKpis = useMemo(() => kpis.filter((k) => visibleKpiIds.has(k.id)), [kpis, visibleKpiIds]);

  if (isLoading && taiKhoanList.length === 0 && deXuatList.length === 0 && planRows.length === 0 && actualRows.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('baoCaoTaiChinh.stats.loading')} centered />
        </div>
        <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted/30 rounded-lg border border-border p-3 animate-pulse h-20" />
          ))}
        </div>
      </div>
    );
  }

  const kpiCustomizeAction = (
    <div className="relative shrink-0" ref={kpiCustomizeRef}>
      <Tooltip content={t('baoCaoTaiChinh.stats.customizeKpiCards')} placement="bottom">
        <button
          type="button"
          onClick={() => setKpiCustomizeOpen((o) => !o)}
          className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium border border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <LayoutGrid size={14} className="shrink-0" />
          <span className="hidden sm:inline">{t('baoCaoTaiChinh.stats.showKpiCards')}</span>
          <ChevronDown size={12} className={cn('shrink-0 transition-transform', kpiCustomizeOpen && 'rotate-180')} />
        </button>
      </Tooltip>
      {kpiCustomizeOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('baoCaoTaiChinh.stats.showKpiCards')}
            </p>
          </div>
          <div className="p-1.5 max-h-64 overflow-y-auto">
            {KPI_IDS.map((id) => (
              <label
                key={id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleKpiIds.has(id)}
                  onChange={() => toggleKpiVisibility(id)}
                  className="rounded border-border"
                />
                <span className="text-xs text-foreground">{t(`baoCaoTaiChinh.kpi.${id}`)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <StatsToolbar
        className="static z-auto border-b border-border/50 print:hidden"
        filters={renderFilters}
        row2Content={renderFiltersMobileRow2}
        row2ContentMobileOnly
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onBack={() => navigate('/tai-chinh')}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
        customActions={kpiCustomizeAction}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4 print:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 print:break-inside-avoid">
            {visibleKpis.map((kpi) => (
              <div
                key={kpi.id}
                className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm flex items-center gap-2.5"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{kpi.value}</p>
                  {'sub' in kpi && kpi.sub && (
                    <p className="text-2xs text-muted-foreground tabular-nums mt-0.5 truncate">{kpi.sub}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {chartsVisible && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-3.5 print:break-inside-avoid">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">{t('baoCaoTaiChinh.chart.thuChiTheoThang')}</h3>
                </div>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <BarChart data={thuChiByMonth} margin={{ top: 4, right: 4, left: 4, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : String(v))}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                            {payload.map((p, i) => (
                              <p key={i} className="text-muted-foreground">
                                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
                                {p.name}: <span className="font-semibold text-foreground">{formatCurrency(Number(p.value))}</span>
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="thu" name={t('thuChi.stats.tongThu')} fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="chi" name={t('thuChi.stats.tongChi')} fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border border-border p-3.5 print:break-inside-avoid">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">{t('baoCaoTaiChinh.chart.planVsActual')}</h3>
                </div>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <BarChart data={planVsActualByMonth} margin={{ top: 4, right: 4, left: 4, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : String(v))}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                            {payload.map((p, i) => (
                              <p key={i} className="text-muted-foreground">
                                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
                                {p.name}: <span className="font-semibold text-foreground">{formatCurrency(Number(p.value))}</span>
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey={t('baoCaoTaiChinh.chart.plan')} fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t('baoCaoTaiChinh.chart.actual')} fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {chiByDanhMucPie.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-3.5 lg:col-span-2 print:break-inside-avoid">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChartIcon size={14} className="text-primary" />
                    <h3 className="text-xs font-semibold text-foreground">{t('baoCaoTaiChinh.chart.chiTheoDanhMuc')}</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                    <PieChart>
                      <Pie
                        data={chiByDanhMucPie}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {chiByDanhMucPie.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {taiKhoanList.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                <Wallet size={14} className="text-primary" />
                <h3 className="text-xs font-semibold text-foreground">{t('baoCaoTaiChinh.table.soDuTaiKhoan')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('thuChi.columns.taiKhoan')}</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('baoCaoTaiChinh.table.soDuHienTai')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {taiKhoanList.map((tk) => (
                      <tr key={tk.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 font-medium text-foreground">{tk.ten_tai_khoan}</td>
                        <td className="text-right px-3 py-2 tabular-nums font-medium">{formatCurrency(tk.so_du_hien_tai ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pendingDeXuatTop.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">{t('baoCaoTaiChinh.table.deXuatChoDuyet')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/tai-chinh/de-xuat-chi-phi')}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('baoCaoTaiChinh.linkToDeXuat')} →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('baoCaoTaiChinh.table.soPhieu')}</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t('baoCaoTaiChinh.table.nguoiDeXuat')}</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thuChi.columns.soTien')}</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t('thuChi.columns.loai')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {pendingDeXuatTop.map((d) => (
                      <tr
                        key={d.id}
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => navigate('/tai-chinh/de-xuat-chi-phi')}
                      >
                        <td className="px-4 py-2 font-medium text-foreground">{d.so_phieu}</td>
                        <td className="px-3 py-2">{d.ten_nguoi_de_xuat}</td>
                        <td className="text-right px-3 py-2 tabular-nums font-medium">{formatCurrency(d.tong_tien)}</td>
                        <td className="px-3 py-2">{d.loai === 'thu' ? t('thuChi.loaiThu') : t('thuChi.loaiChi')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && taiKhoanList.length === 0 && deXuatList.length === 0 && byLoai.every((r) => r.so_giao_dich === 0) && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Inbox size={40} className="mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{t('baoCaoTaiChinh.noData')}</h3>
              <p className="text-xs text-muted-foreground">{t('baoCaoTaiChinh.noDataHint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaoCaoTaiChinhPage;
