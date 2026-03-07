import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  CheckCircle2,
  XCircle,
  Inbox,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import { useChamDiemKpiRecords } from '../hooks/use-cham-diem-kpi';
import { useChamDiemKpiStats } from '../hooks/use-cham-diem-kpi-stats';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { STATS_CHART_HEIGHT } from '../core/stats-constants';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: records = [], isLoading, isError } = useChamDiemKpiRecords();
  const { data: departments = [] } = useDepartments();

  const [filterYearMonths, setFilterYearMonths] = useState<string[]>([]);
  const [filterDeptIds, setFilterDeptIds] = useState<string[]>([]);
  const [chartsVisible, setChartsVisible] = useState(false);

  const {
    filtered,
    byPeriod,
    byDepartment,
    summary,
    periodChartData,
    deptChartData,
    DEPT_COLORS,
  } = useChamDiemKpiStats({
    records,
    filterYearMonths,
    filterDeptIds,
  });

  useEffect(() => {
    const timer = setTimeout(() => setChartsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const periodOptions = useMemo(() => {
    const set = new Set(records.map((r) => `${r.nam}-${String(r.thang).padStart(2, '0')}`));
    const list = Array.from(set).sort((a, b) => b.localeCompare(a));
    return list.map((p) => {
      const [year, month] = p.split('-');
      const label = t('chamDiemKpi.stats.periodLabel', {
        month: parseInt(month, 10),
        year,
      });
      return { value: p, label };
    });
  }, [records, t]);

  const departmentOptions = useMemo(
    () =>
      departments.map((d) => ({ label: d.ten_phong_ban, value: d.id })),
    [departments]
  );

  const activeFilterCount =
    (filterYearMonths.length > 0 ? 1 : 0) + (filterDeptIds.length > 0 ? 1 : 0);

  const handleClearFilters = () => {
    setFilterYearMonths([]);
    setFilterDeptIds([]);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'period',
        label: t('chamDiemKpi.period'),
        icon: Calendar,
        options: periodOptions,
        value: filterYearMonths,
        onChange: setFilterYearMonths,
      },
      {
        key: 'dept',
        label: t('chamDiemKpi.stats.department'),
        icon: Building2,
        options: departmentOptions,
        value: filterDeptIds,
        onChange: setFilterDeptIds,
      },
    ],
    [periodOptions, departmentOptions, filterYearMonths, filterDeptIds, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={periodOptions}
        value={filterYearMonths}
        onChange={setFilterYearMonths}
        placeholder={t('chamDiemKpi.stats.periodPlaceholder')}
        icon={Calendar}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={departmentOptions}
        value={filterDeptIds}
        onChange={setFilterDeptIds}
        placeholder={t('chamDiemKpi.filter.phong')}
        icon={Building2}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">
          {t('common.error') || 'Có lỗi khi tải dữ liệu.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText
            text={t('chamDiemKpi.stats.loading')}
            centered
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card rounded-lg border border-border p-2.5 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-16 bg-muted/60 rounded" />
                    <div className="h-5 w-10 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-3.5 h-[250px] animate-pulse"
              >
                <div className="h-4 w-32 bg-muted rounded mb-3" />
                <div className="h-[200px] bg-muted/30 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = filtered.length === 0;

  return (
    <div className="flex flex-col h-full">
      <DashboardToolbar
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onBack={() => navigate(-1)}
        className="static z-auto"
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-3">
          {isEmpty ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Inbox
                size={40}
                className="mx-auto text-muted-foreground/60 mb-3"
              />
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {t('chamDiemKpi.stats.noData')}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {activeFilterCount > 0
                  ? t('chamDiemKpi.stats.noDataHint')
                  : t('chamDiemKpi.managed.empty')}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('chamDiemKpi.stats.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                      <Target size={15} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xs text-muted-foreground truncate">
                        {t('chamDiemKpi.stats.totalRecords')}
                      </p>
                      <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                        {summary.total}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg border border-emerald-200 dark:border-emerald-800 p-2.5 sm:p-3 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xs text-emerald-700 dark:text-emerald-400 truncate">
                        {t('chamDiemKpi.stats.datCount')}
                      </p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                        {summary.dat}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg border border-rose-200 dark:border-rose-800 p-2.5 sm:p-3 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                      <XCircle size={15} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xs text-rose-700 dark:text-rose-400 truncate">
                        {t('chamDiemKpi.stats.khongDatCount')}
                      </p>
                      <p className="text-lg font-bold text-rose-700 dark:text-rose-300 tabular-nums mt-0.5">
                        {summary.khongDat}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BarChart3 size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xs text-primary truncate">
                        {t('chamDiemKpi.stats.avgScore')}
                      </p>
                      <p className="text-lg font-bold text-primary tabular-nums mt-0.5">
                        {summary.avgScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {chartsVisible && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deptChartData.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3.5">
                      <div className="flex items-center gap-2 mb-3">
                        <PieChartIcon size={14} className="text-primary" />
                        <h3 className="text-xs font-semibold text-foreground">
                          {t('chamDiemKpi.stats.byDepartment')}
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
                        <PieChart>
                          <Pie
                            data={deptChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            innerRadius={38}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {deptChartData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={DEPT_COLORS[i % DEPT_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            wrapperStyle={{ fontSize: '11px' }}
                            formatter={(value: string) => (
                              <span className="text-muted-foreground text-caption">
                                {value}
                              </span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {periodChartData.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-3.5">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 size={14} className="text-primary" />
                        <h3 className="text-xs font-semibold text-foreground">
                          {t('chamDiemKpi.stats.byPeriod')}
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
                        <BarChart
                          data={periodChartData}
                          barSize={24}
                          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            opacity={0.5}
                          />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="total" radius={[6, 6, 0, 0]} name={t('chamDiemKpi.stats.totalRecords')}>
                            {periodChartData.map((_, i) => (
                              <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-primary" />
                    <h3 className="text-xs font-semibold text-foreground">
                      {t('chamDiemKpi.stats.byPeriod')}
                    </h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.period')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.totalRecords')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.datCount')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.khongDatCount')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.avgScore')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
                      {byPeriod.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-6 text-center text-muted-foreground"
                          >
                            {t('chamDiemKpi.my.empty')}
                          </td>
                        </tr>
                      ) : (
                        byPeriod.map((row) => (
                          <tr
                            key={row.period}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-2 font-medium text-foreground">
                              {row.period}
                            </td>
                            <td className="text-right px-3 py-2 font-semibold text-foreground tabular-nums">
                              {row.total}
                            </td>
                            <td className="text-right px-3 py-2 text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                              {row.dat}
                            </td>
                            <td className="text-right px-3 py-2 text-rose-600 dark:text-rose-400 font-medium tabular-nums">
                              {row.khongDat}
                            </td>
                            <td className="text-right px-3 py-2 text-muted-foreground tabular-nums">
                              {row.avg.toFixed(1)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <PieChartIcon size={14} className="text-primary" />
                    <h3 className="text-xs font-semibold text-foreground">
                      {t('chamDiemKpi.stats.byDepartment')}
                    </h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.departmentCol')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.totalRecords')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.datCount')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.khongDatCount')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                          {t('chamDiemKpi.stats.avgScore')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
                      {byDepartment.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-6 text-center text-muted-foreground"
                          >
                            —
                          </td>
                        </tr>
                      ) : (
                        byDepartment.map((row) => (
                          <tr
                            key={row.dept}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-2 font-medium text-foreground">
                              {row.dept}
                            </td>
                            <td className="text-right px-3 py-2 font-semibold text-foreground tabular-nums">
                              {row.total}
                            </td>
                            <td className="text-right px-3 py-2 text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                              {row.dat}
                            </td>
                            <td className="text-right px-3 py-2 text-rose-600 dark:text-rose-400 font-medium tabular-nums">
                              {row.khongDat}
                            </td>
                            <td className="text-right px-3 py-2 text-muted-foreground tabular-nums">
                              {row.avg.toFixed(1)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
