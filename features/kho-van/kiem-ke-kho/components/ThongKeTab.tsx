import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar, Warehouse, ToggleLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useDotKiemKeKhoTomTat } from '../hooks/use-kiem-ke-kho';
import {
  exportKiemKeKhoThongKeToPDF,
  exportKiemKeKhoThongKeToXLSX,
} from '../utils/export-kiem-ke-kho-thong-ke';
import { useKiemKeKhoViewScope } from '../hooks/use-kiem-ke-kho-view-scope';
import { useEmployeesRefQuery } from '@/lib/hooks/use-supabase-ref-queries';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import EmptyState from '../../../../components/shared/EmptyState';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { getDateRangeFromPreset, getPresetFromDates } from '../../../../lib/date-presets';
import { useKiemKeKhoStats } from './stats/useKiemKeKhoStats';
import StatsToolbar from './stats/StatsToolbar';
import StatsCards from './stats/StatsCards';
import StatsTables from './stats/StatsTables';
import type { DotKiemKeKhoTomTat } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

const CUSTOM_PRESET_ID = 'custom';

const TRANG_THAI_OPTIONS = [
  { value: 'draft', labelKey: 'kiemKeKho.trangThaiDot.draft' },
  { value: 'dang_kiem_ke', labelKey: 'kiemKeKho.trangThaiDot.dang_kiem_ke' },
  { value: 'hoan_thanh', labelKey: 'kiemKeKho.trangThaiDot.hoan_thanh' },
];

function useStatsFilterCounts(items: DotKiemKeKhoTomTat[]) {
  return useMemo(() => {
    const trangThaiCounts: Record<string, number> = {};
    const nguoiPhuTrachCounts: Record<string, number> = {};
    const idKhoCounts: Record<string, number> = {};
    items.forEach((d) => {
      trangThaiCounts[d.trang_thai] = (trangThaiCounts[d.trang_thai] ?? 0) + 1;
      nguoiPhuTrachCounts[d.id_nguoi_phu_trach] = (nguoiPhuTrachCounts[d.id_nguoi_phu_trach] ?? 0) + 1;
      (d.id_kho ?? []).forEach((k) => {
        idKhoCounts[k] = (idKhoCounts[k] ?? 0) + 1;
      });
    });
    return { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts };
  }, [items]);
}

const ThongKeTab: React.FC = () => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: khoList = [] } = useKhoList();
  const viewScope = useKiemKeKhoViewScope();

  /** Phạm vi xem áp ở server (giống tab Đợt) — `null` = xem tất cả. */
  const phamVi = useMemo(() => {
    if (viewScope.viewAll) return null;
    const khoChoPhep = viewScope.viewByBranch
      ? khoList
          .filter((k) => k.id_chi_nhanh != null && viewScope.allowedBranchIds.includes(k.id_chi_nhanh))
          .map((k) => k.id)
      : [];
    return { khoChoPhep, currentEmployeeId: viewScope.currentEmployeeId };
  }, [viewScope, khoList]);

  const { data: viewableList = [], isLoading, isError } = useDotKiemKeKhoTomTat(phamVi);

  const { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts } = useStatsFilterCounts(viewableList);

  const [filterTrangThai, setFilterTrangThai] = useState<string[]>([]);
  const [filterNguoiPhuTrach, setFilterNguoiPhuTrach] = useState<string[]>([]);
  const [filterIdKho, setFilterIdKho] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /**
   * Lọc kỳ theo GIAO khoảng ("đợt có chạm vào kỳ"), đúng như tab Đợt lọc ở server
   * (`gte(ngay_ket_thuc, from)` + `lte(ngay_bat_dau, to)`). Trước đây tab này lọc
   * "đợt nằm trọn trong kỳ" nên hai tab ra số khác nhau trên cùng bộ lọc.
   */
  const filteredList = useMemo(() => {
    return viewableList.filter((d: DotKiemKeKhoTomTat) => {
      const matchTrangThai = filterTrangThai.length === 0 || filterTrangThai.includes(d.trang_thai);
      const matchNguoi = filterNguoiPhuTrach.length === 0 || (d.id_nguoi_phu_trach && filterNguoiPhuTrach.includes(d.id_nguoi_phu_trach));
      const matchKho = filterIdKho.length === 0 || (d.id_kho && d.id_kho.some((k) => filterIdKho.includes(k)));
      const matchFrom = !dateFrom || (d.ngay_ket_thuc && d.ngay_ket_thuc >= dateFrom);
      const matchTo = !dateTo || (d.ngay_bat_dau && d.ngay_bat_dau <= dateTo);
      return matchTrangThai && matchNguoi && matchKho && matchFrom && matchTo;
    });
  }, [viewableList, filterTrangThai, filterNguoiPhuTrach, filterIdKho, dateFrom, dateTo]);

  const stats = useKiemKeKhoStats(filteredList);

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value,
        subLabel: undefined as string | undefined,
        count: trangThaiCounts[o.value] ?? 0,
      })),
    [t, trangThaiCounts]
  );
  const nguoiPhuTrachOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiPhuTrachCounts[e.id] ?? 0,
      })),
    [employees, nguoiPhuTrachCounts]
  );
  const idKhoOptions = useMemo(
    () =>
      khoList
        .filter((k) => k.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((k) => ({
          label: k.ten_kho,
          value: k.id,
          subLabel: k.ma_kho,
          count: idKhoCounts[k.id] ?? 0,
        })),
    [khoList, idKhoCounts]
  );

  const dateRangePresets = useMemo(
    () => [
      { id: 'all', label: t('kiemKeKho.filter.periodPlaceholder') },
      { id: 'thisMonth', label: t('kiemKeKho.preset.thisMonth') },
      { id: 'lastMonth', label: t('kiemKeKho.preset.lastMonth') },
      { id: 'thisQuarter', label: t('kiemKeKho.preset.thisQuarter') },
      { id: 'thisYear', label: t('kiemKeKho.preset.thisYear') },
    ],
    [t]
  );
  const dateRangeValue: DateRangeValue = useMemo(
    () => ({ preset: getPresetFromDates(dateFrom, dateTo), customStart: dateFrom, customEnd: dateTo }),
    [dateFrom, dateTo]
  );
  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      setDateFrom(value.customStart);
      setDateTo(value.customEnd);
      return;
    }
    const next = getDateRangeFromPreset(value.preset);
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
  };

  const activeFilterCount =
    filterTrangThai.length +
    filterNguoiPhuTrach.length +
    filterIdKho.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);
  const handleClearFilters = () => {
    setFilterTrangThai([]);
    setFilterNguoiPhuTrach([]);
    setFilterIdKho([]);
    setDateFrom('');
    setDateTo('');
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'ky',
        label: t('kiemKeKho.filter.periodPlaceholder'),
        icon: Calendar,
        options: dateRangePresets.map((p) => ({ label: p.label, value: p.id })),
        value: dateRangeValue.preset === 'all' ? [] : [dateRangeValue.preset],
        onChange: (val: string[]) => {
          const next = val.find((v) => v !== dateRangeValue.preset) ?? 'all';
          const r = getDateRangeFromPreset(next);
          setDateFrom(r.dateFrom);
          setDateTo(r.dateTo);
        },
      },
      { key: 'trang_thai', label: t('kiemKeKho.store.trangThaiCol'), icon: ToggleLeft, options: statusOptions, value: filterTrangThai, onChange: setFilterTrangThai },
      { key: 'id_kho', label: t('kiemKeKho.store.khoCol'), icon: Warehouse, options: idKhoOptions, value: filterIdKho, onChange: setFilterIdKho },
      { key: 'id_nguoi_phu_trach', label: t('kiemKeKho.store.nguoiPhuTrachCol'), icon: User, options: nguoiPhuTrachOptions, value: filterNguoiPhuTrach, onChange: setFilterNguoiPhuTrach },
    ],
    [statusOptions, idKhoOptions, nguoiPhuTrachOptions, filterTrangThai, filterIdKho, filterNguoiPhuTrach, dateRangePresets, dateRangeValue.preset, t]
  );

  const renderFilters = (
    <>
      <DateRangePicker
        presets={dateRangePresets}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        placeholder={t('kiemKeKho.filter.periodPlaceholder')}
        customPresetId={CUSTOM_PRESET_ID}
        className="shrink-0"
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterTrangThai}
        onChange={setFilterTrangThai}
        placeholder={t('kiemKeKho.store.trangThaiCol')}
        icon={ToggleLeft}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={idKhoOptions}
        value={filterIdKho}
        onChange={setFilterIdKho}
        placeholder={t('kiemKeKho.store.khoCol')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguoiPhuTrachOptions}
        value={filterNguoiPhuTrach}
        onChange={setFilterNguoiPhuTrach}
        placeholder={t('kiemKeKho.store.nguoiPhuTrachCol')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const buildExportMeta = () => {
    const filterLabels: string[] = [];
    if (filterTrangThai.length > 0) {
      filterLabels.push(
        `${t('kiemKeKho.store.trangThaiCol')}: ${filterTrangThai.map((v) => t(`kiemKeKho.trangThaiDot.${v}`)).join(', ')}`
      );
    }
    return { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, filterLabels };
  };

  const handleExportReport = async () => {
    const meta = buildExportMeta();
    try {
      // Xuất XLSX (định dạng mặc định từ toolbar dropdown)
      await exportKiemKeKhoThongKeToXLSX(stats.summary, stats.byTrangThai, meta);
    } catch {
      toast.error(t('common.exportError', { defaultValue: 'Xuất file thất bại' }));
    }
  };

  const handleExportPDF = async () => {
    const meta = buildExportMeta();
    try {
      await exportKiemKeKhoThongKeToPDF(stats.summary, stats.byTrangThai, meta);
    } catch {
      toast.error(t('common.exportError', { defaultValue: 'Xuất PDF thất bại' }));
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('kiemKeKho.stats.loadError')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={t('kiemKeKho.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-2.5 animate-pulse">
                <div className="h-12 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = filteredList.length === 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <StatsToolbar
        className="static z-auto print:hidden"
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        onExportReport={handleExportReport}
        onExportPDF={handleExportPDF}
        onPrintReport={handlePrintReport}
      />

      <div className="kiem-ke-kho-stats-content flex-1 min-h-0 overflow-y-auto custom-scrollbar print:overflow-visible">
        <div className="p-3 sm:p-4 pb-4 space-y-4 print:p-0 print:space-y-3">
          {/* Tiêu đề chỉ hiển thị khi in */}
          <div className="hidden print:block mb-3">
            <p className="text-sm font-semibold text-foreground">{t('kiemKeKho.stats.title')}</p>
            {(dateFrom || dateTo) && (
              <p className="text-xs text-muted-foreground">
                {dateFrom && `${t('kiemKeKho.filter.dateFrom')}: ${dateFrom}`}
                {dateFrom && dateTo && ' — '}
                {dateTo && `${t('kiemKeKho.filter.dateTo')}: ${dateTo}`}
              </p>
            )}
          </div>

          {isEmpty ? (
            <EmptyState
              title={t('kiemKeKho.stats.noData')}
              description={
                activeFilterCount > 0
                  ? (t('kiemKeKho.stats.noDataHint') || 'Thử xóa bộ lọc.')
                  : t('kiemKeKho.stats.noDataHint')
              }
              action={
                activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t('common.clearFilters', { count: activeFilterCount })}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <h3 className="text-sm font-semibold text-primary print:hidden">{t('kiemKeKho.stats.title')}</h3>
              <StatsCards summary={stats.summary} />
              <StatsTables byTrangThai={stats.byTrangThai} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongKeTab;
