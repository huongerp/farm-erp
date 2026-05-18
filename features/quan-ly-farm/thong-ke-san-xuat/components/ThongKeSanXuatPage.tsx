import React, { useMemo, lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, BarChart3, CheckCircle2, Eye, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import { useThongKeSanXuat } from '../hooks/use-thong-ke-san-xuat';
import { useThongKeSanXuatPermissions } from '../core/permissions';
import { DATE_PRESETS } from '../core/compute';
import { useThongKeSanXuatStats } from './stats/useThongKeSanXuatStats';
import {
  exportThongKeSanXuatToPDF,
  exportThongKeSanXuatToXLSX,
  printThongKeSanXuat,
} from '../utils/export-thong-ke-san-xuat';
import ThongKeSanXuatSummaryCards from './ThongKeSanXuatSummaryCards';
import ThongKeSanXuatTable from './ThongKeSanXuatTable';
import StatsToolbar from './stats/StatsToolbar';
import StatsTables from './stats/StatsTables';

const StatsCharts = lazy(() => import('./stats/StatsCharts'));

const ThongKeSanXuatPage: React.FC = () => {
  const { t } = useTranslation();
  const { canView, isLoading: permLoading } = useThongKeSanXuatPermissions();

  const {
    isLoading,
    isError,
    filteredRows,
    allRows,
    summary,
    activeFilterCount,
    chiNhanhOptions,
    dateRange,
    setDateRange,
    chiNhanhIds,
    setChiNhanhIds,
    kpiFilter,
    setKpiFilter,
    hienThiFilter,
    setHienThiFilter,
    trangThaiBcncFilter,
    setTrangThaiBcncFilter,
    trangThaiBcscFilter,
    setTrangThaiBcscFilter,
    resetFilters,
  } = useThongKeSanXuat();

  const stats = useThongKeSanXuatStats(filteredRows);

  // ── Period label for export ───────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    if (dateRange.preset === 'all') return 'Toàn bộ dữ liệu';
    const preset = DATE_PRESETS.find((p) => p.id === dateRange.preset);
    if (preset && dateRange.preset !== 'custom') return preset.label;
    const from = dateRange.customStart ? dateRange.customStart.split('-').reverse().join('/') : '';
    const to = dateRange.customEnd ? dateRange.customEnd.split('-').reverse().join('/') : '';
    if (from && to) return `${from} – ${to}`;
    return from || to || 'Toàn bộ';
  }, [dateRange]);

  const handleExportXLSX = useCallback(async () => {
    if (filteredRows.length === 0) { toast.info('Không có dữ liệu để xuất'); return; }
    try {
      await exportThongKeSanXuatToXLSX(summary, stats, periodLabel);
      toast.success('Đã xuất file XLSX');
    } catch { toast.error('Xuất XLSX thất bại'); }
  }, [filteredRows.length, summary, stats, periodLabel]);

  const handleExportPDF = useCallback(async () => {
    if (filteredRows.length === 0) { toast.info('Không có dữ liệu để xuất'); return; }
    try {
      await exportThongKeSanXuatToPDF(summary, stats, periodLabel);
      toast.success('Đã xuất file PDF');
    } catch { toast.error('Xuất PDF thất bại'); }
  }, [filteredRows.length, summary, stats, periodLabel]);

  const handlePrint = useCallback(() => {
    if (filteredRows.length === 0) { toast.info('Không có dữ liệu để in'); return; }
    printThongKeSanXuat(summary, stats, periodLabel);
  }, [filteredRows.length, summary, stats, periodLabel]);

  // ── Option lists ─────────────────────────────────────────────────────────

  const chiNhanhMsOptions = useMemo(
    () => chiNhanhOptions.map((o) => ({ value: o.id, label: o.ten })),
    [chiNhanhOptions]
  );

  const kpiOptions = useMemo(
    () => [
      { value: 'dat', label: t('thongKeSanXuat.filter.kpiDat') },
      { value: 'khong_dat', label: t('thongKeSanXuat.filter.kpiKhongDat') },
    ],
    [t]
  );

  const hienThiOptions = useMemo(
    () => [
      { value: 'du_3bc', label: t('thongKeSanXuat.filter.hienThiDu3Bc') },
      { value: 'thieu_bc', label: t('thongKeSanXuat.filter.hienThiThieuBc') },
    ],
    [t]
  );

  const trangThaiOptions = useMemo(
    () => [
      { value: 'mo', label: t('thongKeSanXuat.filter.mo') },
      { value: 'khoa', label: t('thongKeSanXuat.filter.khoa') },
    ],
    [t]
  );

  // ── Filter groups for mobile sheet ───────────────────────────────────────

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      { key: 'chi_nhanh', label: t('thongKeSanXuat.filter.chiNhanh'), icon: Building2, options: chiNhanhMsOptions, value: chiNhanhIds, onChange: setChiNhanhIds },
      { key: 'kpi', label: 'KPI', icon: CheckCircle2, options: kpiOptions, value: kpiFilter, onChange: setKpiFilter },
      { key: 'hien_thi', label: t('thongKeSanXuat.filter.hienThi'), icon: Eye, options: hienThiOptions, value: hienThiFilter, onChange: setHienThiFilter },
      { key: 'tt_bcnc', label: t('thongKeSanXuat.filter.trangThaiBcnc'), icon: Lock, options: trangThaiOptions, value: trangThaiBcncFilter, onChange: setTrangThaiBcncFilter },
      { key: 'tt_bcsc', label: t('thongKeSanXuat.filter.trangThaiBcsc'), icon: Lock, options: trangThaiOptions, value: trangThaiBcscFilter, onChange: setTrangThaiBcscFilter },
    ],
    [chiNhanhMsOptions, chiNhanhIds, setChiNhanhIds, kpiOptions, kpiFilter, setKpiFilter, hienThiOptions, hienThiFilter, setHienThiFilter, trangThaiOptions, trangThaiBcncFilter, setTrangThaiBcncFilter, trangThaiBcscFilter, setTrangThaiBcscFilter, t]
  );

  // ── Desktop filter chips (single row) ───────────────────────────────────

  const renderFilters = (
    <>
      <DateRangePicker
        presets={DATE_PRESETS}
        value={dateRange}
        onChange={setDateRange}
        className="w-full sm:w-auto"
        customPresetId="custom"
      />
      <FilterChipMultiSelect
        options={chiNhanhMsOptions}
        value={chiNhanhIds}
        onChange={setChiNhanhIds}
        placeholder={t('thongKeSanXuat.filter.chiNhanhAll')}
        icon={Building2}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={kpiOptions}
        value={kpiFilter}
        onChange={setKpiFilter}
        placeholder="KPI"
        icon={CheckCircle2}
        className="w-full sm:w-[130px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={hienThiOptions}
        value={hienThiFilter}
        onChange={setHienThiFilter}
        placeholder={t('thongKeSanXuat.filter.hienThi')}
        icon={Eye}
        className="w-full sm:w-[130px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={trangThaiBcncFilter}
        onChange={setTrangThaiBcncFilter}
        placeholder={t('thongKeSanXuat.filter.trangThaiBcnc')}
        icon={Lock}
        className="w-full sm:w-[110px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={trangThaiBcscFilter}
        onChange={setTrangThaiBcscFilter}
        placeholder={t('thongKeSanXuat.filter.trangThaiBcsc')}
        icon={Lock}
        className="w-full sm:w-[110px]"
        size="md"
      />
    </>
  );

  // ── Guards ───────────────────────────────────────────────────────────────

  if (permLoading || isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('thongKeSanXuat.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-2.5 animate-pulse">
                <div className="h-12 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <AlertCircle size={36} className="opacity-40" />
        <p className="text-sm">{t('thongKeSanXuat.noPermission')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-24 gap-3 text-destructive">
        <AlertCircle size={36} className="opacity-60" />
        <p className="text-sm">{t('thongKeSanXuat.error')}</p>
      </div>
    );
  }

  const isEmpty = filteredRows.length === 0;

  return (
    <div className="flex flex-col h-full">
      <StatsToolbar
        className="static z-auto"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={resetFilters}
        onExportXLSX={handleExportXLSX}
        onExportPDF={handleExportPDF}
        onPrint={handlePrint}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-6 space-y-4">

          {/* Page title */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-primary opacity-70" />
              <h3 className="text-sm font-semibold text-primary">{t('thongKeSanXuat.title')}</h3>
              <span className="text-xs text-muted-foreground">
                {filteredRows.length !== allRows.length
                  ? `${filteredRows.length} / ${allRows.length} ngày`
                  : `${allRows.length} ngày`}
              </span>
            </div>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full px-2 py-0.5 tabular-nums">
              <span className="font-semibold">{summary.ngayDu3Bc}</span> {t('thongKeSanXuat.summary.ngayDu3Bc')}
            </span>
          </div>

          {isEmpty ? (
            <EmptyState
              title={t('thongKeSanXuat.table.empty')}
              description={activeFilterCount > 0 ? 'Thử xóa bộ lọc để xem nhiều dữ liệu hơn.' : undefined}
              action={
                activeFilterCount > 0 ? (
                  <button type="button" onClick={resetFilters} className="text-sm font-medium text-primary hover:underline">
                    {t('thongKeSanXuat.filter.clearAll')}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* ── Summary cards ─────────────────────────────────────── */}
              <ThongKeSanXuatSummaryCards summary={summary} />

              {/* ── Charts (lazy) ─────────────────────────────────────── */}
              <Suspense fallback={<LoadingSpinnerWithText text="Đang tải biểu đồ…" className="py-8" centered />}>
                <StatsCharts stats={stats} />
              </Suspense>

              {/* ── Aggregation tables ────────────────────────────────── */}
              <StatsTables stats={stats} />

              {/* ── Day-by-day detail table ───────────────────────────── */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Chi tiết theo ngày
                </p>
                <ThongKeSanXuatTable rows={filteredRows} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeSanXuatPage;
