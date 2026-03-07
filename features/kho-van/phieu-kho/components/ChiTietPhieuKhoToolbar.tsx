import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Warehouse } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import { useChiTietPhieuKhoStore } from '../store/useChiTietPhieuKhoStore';
import type { ChiTietPhieuKhoFlat } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import { DATE_RANGE_PRESETS } from '../../../he-thong/nhan-vien/core/stats-constants';
import { getDateRangeFromPreset } from '../../../he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '../../../he-thong/nhan-vien/core/stats-constants';

interface Props {
  data: ChiTietPhieuKhoFlat[];
  khoList: Kho[];
}

const ChiTietPhieuKhoToolbar: React.FC<Props> = ({ data, khoList }) => {
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useChiTietPhieuKhoStore();

  const loaiOptions = useMemo(
    () => [
      { value: 'nhap', label: t('phieuKho.tabs.nhap'), count: data.filter((d) => d.loai === 'nhap').length },
      { value: 'xuat', label: t('phieuKho.tabs.xuat'), count: data.filter((d) => d.loai === 'xuat').length },
      { value: 'chuyen', label: t('phieuKho.tabs.chuyen'), count: data.filter((d) => d.loai === 'chuyen').length },
    ],
    [data, t]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: data.filter((d) => d.id_kho === k.id).length,
      })),
    [khoList, data]
  );

  const dateRangeLabel = useMemo(() => {
    const range = getDateRangeFromPreset(
      (filters.datePreset ?? 'this_month') as DateRangePresetId,
      filters.customDateFrom ? new Date(filters.customDateFrom) : undefined,
      filters.customDateEnd ? new Date(filters.customDateEnd) : undefined
    );
    return range.label;
  }, [filters.datePreset, filters.customDateFrom, filters.customDateEnd]);

  const dateFilterActive = useMemo(
    () =>
      (filters.datePreset && filters.datePreset !== 'this_month') ||
      !!(filters.customDateFrom ?? '').trim() ||
      !!(filters.customDateEnd ?? '').trim(),
    [filters.datePreset, filters.customDateFrom, filters.customDateEnd]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.loai?.length ?? 0 ? 1 : 0) +
      (dateFilterActive ? 1 : 0) +
      (filters.khoIds?.length ?? 0 ? 1 : 0),
    [searchTerm, filters.loai?.length, dateFilterActive, filters.khoIds?.length]
  );

  const filterGroupsComputed = useMemo(
    () => [
      {
        key: 'loai',
        label: t('phieuKho.chiTietTab.loaiPhieuCol'),
        icon: FileText,
        options: loaiOptions,
        value: filters.loai ?? [],
        onChange: (val: string[]) => setFilter('loai', val),
      },
      {
        key: 'khoIds',
        label: t('phieuKho.store.khoCol'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoIds ?? [],
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
    ],
    [t, loaiOptions, khoOptions, filters.loai, filters.khoIds, setFilter]
  );

  const dateRangePickerPresets = useMemo(
    () => DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label })),
    []
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.loai ?? []}
        onChange={(v) => setFilter('loai', v)}
        placeholder={t('phieuKho.chiTietTab.loaiPhieuCol')}
        icon={FileText}
        className="w-full sm:w-[140px]"
      />
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={{
          preset: filters.datePreset ?? 'this_month',
          customStart: filters.customDateFrom ?? '',
          customEnd: filters.customDateEnd ?? '',
        }}
        onChange={(v) => {
          setFilter('datePreset', v.preset);
          setFilter('customDateFrom', v.customStart);
          setFilter('customDateEnd', v.customEnd);
        }}
        displayLabel={dateRangeLabel}
        placeholder={t('phieuKho.chiTietTab.dateRangePlaceholder')}
        className="w-full sm:w-auto"
      />
      <FilterChipMultiSelect
        options={khoOptions}
        value={filters.khoIds ?? []}
        onChange={(v) => setFilter('khoIds', v)}
        placeholder={t('phieuKho.store.khoCol')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  return (
    <GenericToolbar
      selectedCount={0}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={() => {}}
      filters={renderFilters}
      filterGroups={filterGroupsComputed}
      showBack
      searchPlaceholder={t('phieuKho.chiTietTab.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={() => {
        setSearchTerm('');
        setFilter('loai', []);
        setFilter('datePreset', 'this_month');
        setFilter('customDateFrom', '');
        setFilter('customDateEnd', '');
        setFilter('khoIds', []);
      }}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ChiTietPhieuKhoToolbar;
