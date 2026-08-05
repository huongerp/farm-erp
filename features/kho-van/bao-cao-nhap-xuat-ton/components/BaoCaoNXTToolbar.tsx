import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileDown,
  Printer,
  RefreshCw,
  ChevronDown,
  Warehouse,
  ClipboardList,
  Tags,
  Package,
  Filter,
} from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import MobileFilterSheet from '../../../../components/ui/MobileFilterSheet';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import type { NXTReportFilters } from '../core/types';
import type { LoaiPhieuKho } from '../../phieu-kho/core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import { LOAI_PHIEU_OPTIONS, TRANG_THAI_PHIEU_OPTIONS } from '../core/constants';
import { getDateRangeFromPreset, getPresetFromDates } from '../core/datePresets';
import { cn } from '../../../../lib/utils';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-supabase-ref-queries';
import { useDanhMucCap2WithParent } from '../../danh-muc-hang-hoa/hooks/use-danh-muc-hang-hoa';

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
/** Số FilterChip tối đa hiện ngoài toolbar (không tính DateRange). */
const MAX_VISIBLE_FILTER_CHIPS = 3;

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
  const [showOverflowFilters, setShowOverflowFilters] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const { data: hangHoaList = [], isLoading: hangHoaLoading } = useHangHoaRefQuery();
  const { data: danhMucCap2 = [] } = useDanhMucCap2WithParent();

  useEffect(() => {
    if (!filters.categoryIds.length) return;
    if (hangHoaLoading) return;
    const catSet = new Set(filters.categoryIds);
    const allowed = new Set(
      hangHoaList.filter((h) => h.danh_muc_id != null && catSet.has(h.danh_muc_id)).map((h) => String(h.id))
    );
    const next = filters.hangHoaIds.filter((id) => allowed.has(String(id)));
    if (next.length === filters.hangHoaIds.length) return;
    onFiltersChange({ ...filters, hangHoaIds: next });
  }, [filters.categoryIds, filters.hangHoaIds, hangHoaList, hangHoaLoading, filters, onFiltersChange]);

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

  const categoryOptions = useMemo(
    () =>
      danhMucCap2.map((d) => ({
        label: d.ten_danh_muc_cha ? `${d.ten_danh_muc_cha} / ${d.ten_danh_muc}` : d.ten_danh_muc,
        value: d.id,
      })),
    [danhMucCap2]
  );

  const productOptions = useMemo(() => {
    const catSet = filters.categoryIds.length > 0 ? new Set(filters.categoryIds) : null;
    return hangHoaList
      .filter((h) => {
        if (!catSet) return true;
        return h.danh_muc_id != null && catSet.has(h.danh_muc_id);
      })
      .map((h) => ({
        label: h.ten_hang ?? h.ten_hang_hoa,
        value: String(h.id),
        subLabel: h.ma_hang ?? h.ma_hang_hoa,
      }));
  }, [hangHoaList, filters.categoryIds]);

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
        onChange: (val: string[]) => onFiltersChange({ ...filters, loaiPhieu: val as unknown as LoaiPhieuKho[] }),
      },
      {
        key: 'trangThaiPhieu',
        label: t('baoCaonhapXuatTon.filter.trangThai'),
        icon: ClipboardList,
        options: trangThaiOptions.map((o) => ({ label: o.label, value: String(o.value) })),
        value: filters.trangThaiPhieu.map(String),
        onChange: (val: string[]) =>
          onFiltersChange({ ...filters, trangThaiPhieu: val.map(Number) as (0 | 1 | 2 | 3)[] }),
      },
      {
        key: 'categoryIds',
        label: t('baoCaonhapXuatTon.filter.category'),
        icon: Tags,
        options: categoryOptions,
        value: filters.categoryIds,
        onChange: (val: string[]) => onFiltersChange({ ...filters, categoryIds: val }),
      },
      {
        key: 'hangHoaIds',
        label: t('baoCaonhapXuatTon.filter.product'),
        icon: Package,
        options: productOptions,
        value: filters.hangHoaIds,
        onChange: (val: string[]) => onFiltersChange({ ...filters, hangHoaIds: val }),
      },
    ],
    [
      t,
      filters,
      warehouseOptions,
      loaiOptions,
      trangThaiOptions,
      categoryOptions,
      productOptions,
      onFiltersChange,
    ]
  );

  /** Chip hiện ngoài (desktop); phần còn lại vào nút Filter. */
  const visibleFilterGroups = useMemo(
    () => filterGroups.slice(0, MAX_VISIBLE_FILTER_CHIPS),
    [filterGroups]
  );
  const overflowFilterGroups = useMemo(
    () => filterGroups.slice(MAX_VISIBLE_FILTER_CHIPS),
    [filterGroups]
  );
  const overflowActiveCount = useMemo(
    () => overflowFilterGroups.reduce((sum, g) => sum + g.value.length, 0),
    [overflowFilterGroups]
  );

  const handleClearOverflowFilters = () => {
    onFiltersChange({ ...filters, categoryIds: [], hangHoaIds: [] });
  };

  const chipClassByKey: Record<string, string> = {
    warehouseIds: 'w-full sm:w-[180px]',
    loaiPhieu: 'w-full sm:w-[160px]',
    trangThaiPhieu: 'w-full sm:w-[150px]',
    categoryIds: 'w-full sm:w-[200px]',
    hangHoaIds: 'w-full sm:w-[200px]',
  };

  const placeholderByKey: Record<string, string> = {
    warehouseIds: t('baoCaonhapXuatTon.filter.warehousePlaceholder'),
    loaiPhieu: t('baoCaonhapXuatTon.filter.loaiPhieuPlaceholder'),
    trangThaiPhieu: t('baoCaonhapXuatTon.filter.trangThaiPlaceholder'),
    categoryIds: t('baoCaonhapXuatTon.filter.categoryPlaceholder'),
    hangHoaIds: t('baoCaonhapXuatTon.filter.productPlaceholder'),
  };

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
      {visibleFilterGroups.map((group) => (
        <FilterChipMultiSelect
          key={group.key}
          options={group.options}
          value={group.value}
          onChange={group.onChange}
          placeholder={placeholderByKey[group.key] ?? group.label}
          icon={group.icon}
          className={chipClassByKey[group.key] ?? 'w-full sm:w-[180px]'}
          size="md"
        />
      ))}
      {overflowFilterGroups.length > 0 && (
        <button
          type="button"
          onClick={() => setShowOverflowFilters(true)}
          aria-label={t('common.openFiltersAria')}
          className={cn(
            'shrink-0 h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all',
            overflowActiveCount > 0
              ? 'bg-primary/5 border-primary/40 text-primary'
              : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Filter size={14} />
          <span>{t('shared.mobileFilter.title')}</span>
          {overflowActiveCount > 0 && (
            <span className="ml-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center bg-primary text-white text-2xs font-bold rounded-full tabular-nums">
              {overflowActiveCount}
            </span>
          )}
        </button>
      )}
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
    <>
      <DashboardToolbar
        onBack={() => window.history.back()}
        filters={renderFilters}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={onClearAllFilters}
        actions={actions}
        className="print:hidden"
      />
      {overflowFilterGroups.length > 0 && (
        <MobileFilterSheet
          open={showOverflowFilters}
          onClose={() => setShowOverflowFilters(false)}
          groups={overflowFilterGroups}
          onClearAll={handleClearOverflowFilters}
        />
      )}
    </>
  );
};

export default BaoCaoNXTToolbar;
