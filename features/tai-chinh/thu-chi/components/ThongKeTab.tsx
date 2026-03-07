import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Wallet,
  List,
  Inbox,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { useThuChiStatsByLoai, useThuChiStatsByTaiKhoan, useThuChiStatsByDanhMuc } from '../hooks/use-thu-chi';
import { formatCurrency, formatDateTime } from '../../../../lib/utils';
import { exportThuChiStatsToExcel } from '../utils/export-thu-chi-stats-excel';
import { exportThuChiStatsToPdf } from '../utils/export-thu-chi-stats-pdf';
import { DATE_RANGE_PRESETS, STATS_CHART_HEIGHT, THU_CHI_CHART_COLORS } from '../core/stats-constants';
import type { DateRangePresetId } from '../core/stats-constants';
import { getDateRangeFromPreset, toYYYYMMDD } from '../utils/stats-date-range';
import StatsToolbar from './stats/StatsToolbar';

function loaiLabel(loai: string, t: (k: string) => string): string {
  if (loai === 'thu') return t('thuChi.loaiThu');
  if (loai === 'chi') return t('thuChi.loaiChi');
  return t('thuChi.loaiChuyenQuy');
}

interface ThongKeTabProps {
  onBack?: () => void;
}

const ThongKeTab: React.FC<ThongKeTabProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [filterLoai, setFilterLoai] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePresetId>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [chartsVisible, setChartsVisible] = useState(false);

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

  const { data: byLoaiRaw = [], isLoading: loadingLoai } = useThuChiStatsByLoai(tuNgay, denNgay);
  const { data: byTaiKhoan = [], isLoading: loadingTk } = useThuChiStatsByTaiKhoan(tuNgay, denNgay);
  const { data: byDanhMucRaw = [], isLoading: loadingDm } = useThuChiStatsByDanhMuc(tuNgay, denNgay);

  const byLoai = useMemo(() => {
    if (filterLoai.length === 0) return byLoaiRaw;
    return byLoaiRaw.filter((r) => filterLoai.includes(r.loai));
  }, [byLoaiRaw, filterLoai]);

  const byDanhMuc = useMemo(() => {
    if (filterLoai.length === 0) return byDanhMucRaw;
    return byDanhMucRaw.filter((r) => filterLoai.includes(r.loai));
  }, [byDanhMucRaw, filterLoai]);

  const isLoading = loadingLoai || loadingTk || loadingDm;
  const hasData = byLoaiRaw.some((r) => r.so_giao_dich > 0) || byTaiKhoan.length > 0 || byDanhMucRaw.length > 0;

  const loaiOptions = useMemo(
    () => [
      { label: t('thuChi.loaiThu'), value: 'thu' },
      { label: t('thuChi.loaiChi'), value: 'chi' },
      { label: t('thuChi.loaiChuyenQuy'), value: 'chuyen_quy' },
    ],
    [t]
  );

  const activeFilterCount = filterLoai.length + (dateRangePreset === 'custom' ? 1 : 0);

  const handleClearFilters = useCallback(() => {
    setFilterLoai([]);
    setDateRangePreset('all');
    setCustomStart('');
    setCustomEnd('');
  }, []);

  const filterGroups = useMemo(
    () => [
      {
        key: 'loai',
        label: t('thuChi.filterLoai'),
        icon: BarChart3,
        options: loaiOptions,
        value: filterLoai,
        onChange: (val: string[]) => setFilterLoai(val),
      },
    ],
    [t, loaiOptions, filterLoai]
  );

  const handleExportReport = useCallback(
    async (format: 'excel' | 'pdf') => {
      const filterLoaiLabels = filterLoai.map((v) => loaiOptions.find((o) => o.value === v)?.label ?? v);
      const meta = {
        dateRangeLabel: dateRange.label,
        filterLoaiLabels,
        exportedAt: formatDateTime(new Date()),
      };
      try {
        if (format === 'excel') {
          await exportThuChiStatsToExcel(tuNgay, denNgay, byLoai, byTaiKhoan, byDanhMuc, t);
          toast.success(t('thuChi.stats.exportSuccess'), { description: t('thuChi.stats.exportSuccessDesc') });
        } else {
          await exportThuChiStatsToPdf(meta, byLoai, byTaiKhoan, byDanhMuc);
          toast.success(t('thuChi.stats.exportSuccess'), { description: t('thuChi.stats.exportSuccessDesc') });
        }
      } catch {
        toast.error(t('thuChi.stats.exportError'));
      }
    },
    [tuNgay, denNgay, byLoai, byTaiKhoan, byDanhMuc, dateRange.label, filterLoai, loaiOptions, t]
  );

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setChartsVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  const dateRangePickerPresets = useMemo(() => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })), []);

  const renderFilters = (
    <>
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={{ preset: dateRangePreset, customStart, customEnd }}
        onChange={(v) => {
          setDateRangePreset(v.preset as DateRangePresetId);
          setCustomStart(v.customStart);
          setCustomEnd(v.customEnd);
        }}
        displayLabel={dateRange.label}
        placeholder={t('thuChi.stats.dateRangePlaceholder')}
      />
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filterLoai}
        onChange={setFilterLoai}
        placeholder={t('thuChi.filterLoai')}
        icon={BarChart3}
        className="w-full sm:w-[160px]"
        size="md"
        hideZeroCount={false}
      />
    </>
  );

  const kpis = useMemo(() => {
    const thu = byLoaiRaw.find((r) => r.loai === 'thu');
    const chi = byLoaiRaw.find((r) => r.loai === 'chi');
    const cq = byLoaiRaw.find((r) => r.loai === 'chuyen_quy');
    const totalGd = byLoaiRaw.reduce((s, r) => s + r.so_giao_dich, 0);
    return [
      {
        id: 'thu',
        label: t('thuChi.loaiThu'),
        value: formatCurrency(thu?.tong_tien ?? 0),
        sub: `${thu?.so_giao_dich ?? 0} ${t('thuChi.stats.soGiaoDich')}`,
        icon: ArrowDownCircle,
        bg: 'bg-emerald-500/10',
        color: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        id: 'chi',
        label: t('thuChi.loaiChi'),
        value: formatCurrency(chi?.tong_tien ?? 0),
        sub: `${chi?.so_giao_dich ?? 0} ${t('thuChi.stats.soGiaoDich')}`,
        icon: ArrowUpCircle,
        bg: 'bg-rose-500/10',
        color: 'text-rose-600 dark:text-rose-400',
      },
      {
        id: 'chuyen_quy',
        label: t('thuChi.stats.chuyenQuy'),
        value: formatCurrency(cq?.tong_tien ?? 0),
        sub: `${cq?.so_giao_dich ?? 0} ${t('thuChi.stats.soGiaoDich')}`,
        icon: ArrowRightLeft,
        bg: 'bg-violet-500/10',
        color: 'text-violet-600 dark:text-violet-400',
      },
      {
        id: 'total',
        label: t('thuChi.stats.tongGiaoDich'),
        value: String(totalGd),
        sub: '',
        icon: BarChart3,
        bg: 'bg-primary/10',
        color: 'text-primary',
      },
    ];
  }, [byLoaiRaw, t]);

  const pieData = useMemo(
    () =>
      byLoai
        .filter((r) => r.so_giao_dich > 0 || r.tong_tien > 0)
        .map((r) => ({ name: loaiLabel(r.loai, t), value: r.tong_tien })),
    [byLoai, t]
  );

  const barDataByTaiKhoan = useMemo(
    () =>
      byTaiKhoan.slice(0, 10).map((r) => ({
        name: r.ten_tai_khoan.length > 12 ? r.ten_tai_khoan.slice(0, 12) + '…' : r.ten_tai_khoan,
        thu: r.tong_thu,
        chi: r.tong_chi,
      })),
    [byTaiKhoan]
  );

  if (isLoading && !byLoaiRaw.length && !byTaiKhoan.length && !byDanhMucRaw.length) {
    return (
      <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('thuChi.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted/30 rounded-lg border border-border p-2.5 animate-pulse">
                <div className="h-10 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-[240px] bg-muted/30 rounded-xl border border-border animate-pulse" />
            <div className="h-[240px] bg-muted/30 rounded-xl border border-border animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !hasData;

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <StatsToolbar
        className="static z-auto border-b border-border/50 print:hidden"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onPrintReport={handlePrintReport}
        onBack={onBack}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4 print:p-4 print:space-y-4">
          {isEmpty ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Inbox size={40} className="mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{t('thuChi.stats.noData')}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {activeFilterCount > 0 ? t('thuChi.stats.noDataHint') : t('thuChi.stats.noDataInPeriod')}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('thuChi.stats.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-primary print:text-base">{t('thuChi.stats.title')}</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:break-inside-avoid">
                {kpis.map((kpi) => (
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
                      {kpi.sub && (
                        <p className="text-2xs text-muted-foreground tabular-nums mt-0.5 truncate">{kpi.sub}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {chartsVisible && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pieData.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3.5 print:break-inside-avoid">
                      <div className="flex items-center gap-2 mb-3">
                        <PieChartIcon size={14} className="text-primary" />
                        <h3 className="text-xs font-semibold text-foreground">{t('thuChi.stats.chartByLoai')}</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={40}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={THU_CHI_CHART_COLORS[i % THU_CHI_CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                                  {payload.map((p, i) => (
                                    <p key={i} className="text-muted-foreground">
                                      <span
                                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                                        style={{ backgroundColor: p.color ?? p.fill }}
                                      />
                                      {p.name}: <span className="font-semibold text-foreground">{formatCurrency(Number(p.value))}</span>
                                    </p>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: '11px' }}
                            formatter={(value: string) => (
                              <span className="text-muted-foreground text-caption">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {barDataByTaiKhoan.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3.5 print:break-inside-avoid">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet size={14} className="text-primary" />
                        <h3 className="text-xs font-semibold text-foreground">{t('thuChi.stats.chartByTaiKhoan')}</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
                        <BarChart data={barDataByTaiKhoan} margin={{ top: 4, right: 4, left: 4, bottom: 24 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            angle={-20}
                            textAnchor="end"
                            height={56}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : String(v))}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              return (
                                <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                                  {payload.map((p, i) => (
                                    <p key={i} className="text-muted-foreground">
                                      <span
                                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                                        style={{ backgroundColor: p.color ?? p.fill }}
                                      />
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
                  )}
                </div>
              )}

              {byTaiKhoan.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-primary" />
                      <h3 className="text-xs font-semibold text-foreground">{t('thuChi.stats.byTaiKhoan')}</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('thuChi.columns.taiKhoan')}</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thuChi.stats.tongThu')}</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thuChi.stats.tongChi')}</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thuChi.stats.soGiaoDich')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {byTaiKhoan.map((r) => (
                          <tr key={r.id_tai_khoan} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2 font-medium text-foreground">{r.ten_tai_khoan}</td>
                            <td className="text-right px-3 py-2 tabular-nums text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(r.tong_thu)}
                            </td>
                            <td className="text-right px-3 py-2 tabular-nums text-rose-600 dark:text-rose-400">
                              {formatCurrency(r.tong_chi)}
                            </td>
                            <td className="text-right px-3 py-2 tabular-nums">{r.so_giao_dich}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {byDanhMuc.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <List size={14} className="text-primary" />
                      <h3 className="text-xs font-semibold text-foreground">{t('thuChi.stats.byDanhMuc')}</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('thuChi.columns.danhMuc')}</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t('thuChi.columns.loai')}</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thuChi.stats.soGiaoDich')}</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thuChi.columns.soTien')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {byDanhMuc.map((r, i) => (
                          <tr key={`${r.id_danh_muc}-${r.loai}-${i}`} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2 font-medium text-foreground">{r.ten_danh_muc}</td>
                            <td className="px-3 py-2">{loaiLabel(r.loai, t)}</td>
                            <td className="text-right px-3 py-2 tabular-nums">{r.so_giao_dich}</td>
                            <td className="text-right px-3 py-2 tabular-nums font-medium">{formatCurrency(r.tong_tien)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
