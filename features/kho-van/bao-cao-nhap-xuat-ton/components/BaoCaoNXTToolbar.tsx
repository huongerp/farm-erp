import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, Printer, RefreshCw, ChevronDown, Warehouse, ClipboardList } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import type { NXTReportFilters } from '../core/types';
import type { LoaiPhieuKho } from '../../phieu-kho/core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import { LOAI_PHIEU_OPTIONS, TRANG_THAI_PHIEU_OPTIONS } from '../core/constants';
import { getDateRangeFromPreset, getPresetFromDates } from '../core/datePresets';
import { cn } from '../../../../lib/utils';

interface BaoCaoNXTToolbarProps {
  filters: NXTReportFilters;
  onFiltersChange: (next: NXTReportFilters) => void;
  khoList: Kho[];
  activeFilterCount: number;
  onClearAllFilters: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onRefresh: () => void;
}

const CUSTOM_PRESET_ID = 'custom';

const BaoCaoNXTToolbar: React.FC<BaoCaoNXTToolbarProps> = ({
  filters,
  onFiltersChange,
  khoList,
  activeFilterCount,
  onClearAllFilters,
  onExportExcel,
  onExportPdf,
  onPrint,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const dateRangePresets = useMemo(
    () => [
      { id: 'all', label: t('baoCaonhapXuatTon.preset.all') },
      { id: 'thisMonth', label: t('baoCaonhapXuatTon.preset.thisMonth') },
      { id: 'lastMonth', label: t('baoCaonhapXuatTon.preset.lastMonth') },
      { id: 'thisQuarter', label: t('baoCaonhapXuatTon.preset.thisQuarter') },
      { id: 'thisYear', label: t('baoCaonhapXuatTon.preset.thisYear') },
    ],
    [t]
  );

  const dateRangeValue: DateRangeValue = useMemo(
    () => ({
      preset: getPresetFromDates(filters.dateFrom, filters.dateTo),
      customStart: filters.dateFrom,
      customEnd: filters.dateTo,
    }),
    [filters.dateFrom, filters.dateTo]
  );

  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      onFiltersChange({ ...filters, dateFrom: value.customStart, dateTo: value.customEnd });
    } else {
      const { dateFrom, dateTo } = getDateRangeFromPreset(value.preset);
      onFiltersChange({ ...filters, dateFrom, dateTo });
    }
  };

  const warehouseOptions = useMemo(
    () => khoList.map((k) => ({ label: k.ten_kho, value: k.id, subLabel: k.ma_kho })),
    [khoList]
  );
  const loaiOptions = useMemo(
    () => LOAI_PHIEU_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value })),
    [t]
  );
  const trangThaiOptions = useMemo(
    () => TRANG_THAI_PHIEU_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value as number })),
    [t]
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'warehouseIds',
        label: t('baoCaonhapXuatTon.filter.warehouse'),
        icon: Warehouse,
        options: warehouseOptions.map((o) => ({ ...o, value: String(o.value) })),
        value: filters.warehouseIds,
        onChange: (val: string[]) => onFiltersChange({ ...filters, warehouseIds: val }),
      },
      {
        key: 'loaiPhieu',
        label: t('baoCaonhapXuatTon.filter.loaiPhieu'),
        icon: ClipboardList,
        options: loaiOptions.map((o) => ({ ...o, value: o.value })),
        value: filters.loaiPhieu,
        onChange: (val: string[]) => onFiltersChange({ ...filters, loaiPhieu: val as LoaiPhieuKho[] }),
      },
      {
        key: 'trangThaiPhieu',
        label: t('baoCaonhapXuatTon.filter.trangThai'),
        icon: ClipboardList,
        options: trangThaiOptions.map((o) => ({ label: o.label, value: String(o.value) })),
        value: filters.trangThaiPhieu.map(String),
        onChange: (val: string[]) =>
          onFiltersChange({ ...filters, trangThaiPhieu: val.map(Number) as (0 | 1 | 2)[] }),
      },
    ],
    [t, filters, warehouseOptions, loaiOptions, trangThaiOptions, onFiltersChange]
  );

  const renderFilters = (
    <>
      <DateRangePicker
        presets={dateRangePresets}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        placeholder={t('baoCaonhapXuatTon.filter.periodPlaceholder')}
        customPresetId={CUSTOM_PRESET_ID}
        className="shrink-0"
      />
      <FilterChipMultiSelect
        options={warehouseOptions}
        value={filters.warehouseIds}
        onChange={(v) => onFiltersChange({ ...filters, warehouseIds: v })}
        placeholder={t('baoCaonhapXuatTon.filter.warehousePlaceholder')}
        icon={FileDown}
        className="w-full sm:w-[180px]"
        size="md"
      />
      <FilterChipMultiSelect<LoaiPhieuKho>
        options={loaiOptions}
        value={filters.loaiPhieu}
        onChange={(v) => onFiltersChange({ ...filters, loaiPhieu: v })}
        placeholder={t('baoCaonhapXuatTon.filter.loaiPhieuPlaceholder')}
        icon={FileDown}
        className="w-full sm:w-[160px]"
        size="md"
      />
    </>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0" ref={exportRef}>
        <button
          type="button"
          onClick={() => setExportOpen((v) => !v)}
          className={cn(
            'h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all',
            exportOpen
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <FileDown size={14} />
          <span>{t('baoCaonhapXuatTon.export')}</span>
          <ChevronDown size={12} className={cn('transition-transform', exportOpen && 'rotate-180')} />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                onExportExcel();
                setExportOpen(false);
              }}
              className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors"
            >
              <FileDown size={16} className="text-muted-foreground" />
              {t('baoCaonhapXuatTon.exportExcel')}
            </button>
            <button
              type="button"
              onClick={() => {
                onExportPdf();
                setExportOpen(false);
              }}
              className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors border-t border-border"
            >
              <FileDown size={16} className="text-muted-foreground" />
              {t('baoCaonhapXuatTon.exportPdf')}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onPrint}
        className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
      >
        <Printer size={14} />
        <span className="hidden sm:inline">{t('baoCaonhapXuatTon.print')}</span>
      </button>
      <button
        type="button"
        onClick={onRefresh}
        className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
      >
        <RefreshCw size={14} />
        <span className="hidden sm:inline">{t('baoCaonhapXuatTon.refresh')}</span>
      </button>
    </div>
  );

  return (
    <DashboardToolbar
      onBack={() => window.history.back()}
      filters={renderFilters}
      filterGroups={filterGroups}
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearAllFilters}
      actions={actions}
      className="print:hidden"
    />
  );
};

export default BaoCaoNXTToolbar;
