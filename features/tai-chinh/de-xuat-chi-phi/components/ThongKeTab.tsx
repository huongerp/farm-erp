import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import { useDeXuatChiPhiList } from '../hooks/use-de-xuat-chi-phi';
import { useDeXuatChiPhiStats } from './stats/useDeXuatChiPhiStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsCharts from './stats/StatsCharts';
import StatsTables from './stats/StatsTables';
import { DATE_RANGE_PRESETS } from '../core/stats-constants';
import type { DateRangePresetId } from '../core/stats-constants';
import { getDateRangeFromPreset, toYYYYMMDD } from '../utils/stats-date-range';
import type { DeXuatChiPhi } from '../core/types';

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: list = [], isLoading, isError } = useDeXuatChiPhiList();

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterLoai, setFilterLoai] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePresetId>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((d) => {
      const key = String(d.trang_thai);
      m[key] = (m[key] ?? 0) + 1;
    });
    return m;
  }, [list]);

  const loaiCounts = useMemo(() => {
    const thu = list.filter((d) => d.loai === 'thu').length;
    const chi = list.filter((d) => d.loai === 'chi').length;
    return { thu, chi };
  }, [list]);

  const dateRange = useMemo(
    () =>
      getDateRangeFromPreset(
        dateRangePreset,
        customStart ? new Date(customStart) : undefined,
        customEnd ? new Date(customEnd) : undefined
      ),
    [dateRangePreset, customStart, customEnd]
  );

  const rangeStartStr = toYYYYMMDD(dateRange.start);
  const rangeEndStr = toYYYYMMDD(dateRange.end);

  const filteredList = useMemo(() => {
    return list.filter((d: DeXuatChiPhi) => {
      const statusStr = String(d.trang_thai);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(statusStr);
      const matchLoai = filterLoai.length === 0 || filterLoai.includes(d.loai);
      const matchDate = !d.ngay || (d.ngay >= rangeStartStr && d.ngay <= rangeEndStr);
      return matchStatus && matchLoai && matchDate;
    });
  }, [list, filterStatus, filterLoai, rangeStartStr, rangeEndStr]);

  const stats = useDeXuatChiPhiStats(filteredList);

  const statusOptions = useMemo(
    () => [
      {
        label: t('deXuatChiPhi.status.pending'),
        value: '0',
        count: statusCounts['0'] ?? 0,
      },
      {
        label: t('deXuatChiPhi.status.approved'),
        value: '1',
        count: statusCounts['1'] ?? 0,
      },
      {
        label: t('deXuatChiPhi.status.rejected'),
        value: '2',
        count: statusCounts['2'] ?? 0,
      },
    ],
    [t, statusCounts]
  );

  const loaiOptions = useMemo(
    () => [
      { label: t('deXuatChiPhi.loaiThu'), value: 'thu', count: loaiCounts.thu },
      { label: t('deXuatChiPhi.loaiChi'), value: 'chi', count: loaiCounts.chi },
    ],
    [t, loaiCounts]
  );

  const activeFilterCount =
    filterStatus.length +
    filterLoai.length +
    (dateRangePreset === 'custom' ? 1 : 0);

  const handleClearFilters = () => {
    setFilterStatus([]);
    setFilterLoai([]);
    setDateRangePreset('this_month');
    setCustomStart('');
    setCustomEnd('');
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filterStatus,
        onChange: setFilterStatus,
      },
      {
        key: 'loai',
        label: t('deXuatChiPhi.filterLoai'),
        icon: ArrowDownCircle,
        options: loaiOptions,
        value: filterLoai,
        onChange: setFilterLoai,
      },
    ],
    [t, statusOptions, loaiOptions, filterStatus, filterLoai]
  );

  const dateRangePickerPresets = useMemo(
    () => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })),
    [t]
  );

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
        placeholder={t('deXuatChiPhi.stats.dateRangePlaceholder')}
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterStatus}
        onChange={setFilterStatus}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filterLoai}
        onChange={setFilterLoai}
        placeholder={t('deXuatChiPhi.filterLoai')}
        icon={ArrowDownCircle}
        className="w-full sm:w-[140px]"
        size="md"
      />
    </>
  );

  const handleExportReport = async (format: 'excel' | 'pdf') => {
    toast.info(t('deXuatChiPhi.stats.exportReport') + ` (${format}) – Đang phát triển`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 rounded-xl border border-border bg-card">
        <p className="text-sm text-destructive">{t('deXuatChiPhi.stats.loadError')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('deXuatChiPhi.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-muted/30 rounded-lg border border-border p-2.5 animate-pulse"
              >
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

  const isEmpty = filteredList.length === 0;

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
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4 print:p-4 print:space-y-4">
          {isEmpty ? (
            <EmptyState
              title={t('deXuatChiPhi.stats.noData')}
              description={
                activeFilterCount > 0
                  ? t('deXuatChiPhi.stats.noDataHint')
                  : t('deXuatChiPhi.stats.noDataHint')
              }
              action={
                activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-sm font-medium text-primary hover:underline print:hidden"
                  >
                    {t('common.clearFilters', { count: activeFilterCount })}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <h2 className="text-sm font-semibold text-primary print:text-base">
                {t('deXuatChiPhi.stats.title')}
              </h2>
              <div className="print:break-inside-avoid">
                <StatsCards summary={stats.summary} />
              </div>
              <StatsCharts
                byTrangThai={stats.byTrangThai}
                byLoai={stats.byLoai}
                byMonth={stats.byMonth}
                byNguoiDeXuat={stats.byNguoiDeXuat}
              />
              <StatsTables
                byTrangThai={stats.byTrangThai}
                byLoai={stats.byLoai}
                byNguoiDeXuat={stats.byNguoiDeXuat}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
