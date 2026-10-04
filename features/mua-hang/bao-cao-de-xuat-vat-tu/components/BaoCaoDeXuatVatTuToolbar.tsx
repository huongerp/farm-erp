import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Warehouse, User, UserCheck, Tag, Calendar } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import type { DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField, type FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import type { BaoCaoDeXuatVatTuFilters } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { TRANG_THAI_PHIEU_OPTIONS } from '../core/constants';
import { getDateRangeFromPreset, getPresetFromDates } from '../core/datePresets';
import BaoCaoExportDropdown from './BaoCaoExportDropdown';

interface BaoCaoDeXuatVatTuToolbarProps {
  filters: BaoCaoDeXuatVatTuFilters;
  onFiltersChange: (next: BaoCaoDeXuatVatTuFilters) => void;
  khoList: Kho[];
  employees: EmployeeRef[];
  activeFilterCount: number;
  onClearAllFilters: () => void;
  onExport: (format: 'excel' | 'pdf') => Promise<void>;
}

const CUSTOM_PRESET_ID = 'custom';

const BaoCaoDeXuatVatTuToolbar: React.FC<BaoCaoDeXuatVatTuToolbarProps> = ({
  filters,
  onFiltersChange,
  khoList,
  employees,
  activeFilterCount,
  onClearAllFilters,
  onExport,
}) => {
  const { t } = useTranslation();

  const dateRangePresets = useMemo(
    () => [
      { id: 'all', label: t('baoCaodeXuatVatTu.filter.periodPlaceholder') },
      { id: 'thisMonth', label: t('baoCaodeXuatVatTu.preset.thisMonth') },
      { id: 'lastMonth', label: t('baoCaodeXuatVatTu.preset.lastMonth') },
      { id: 'thisQuarter', label: t('baoCaodeXuatVatTu.preset.thisQuarter') },
      { id: 'thisYear', label: t('baoCaodeXuatVatTu.preset.thisYear') },
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

  const dateRangeDisplayLabel = useMemo(() => {
    if (!filters.dateFrom && !filters.dateTo) return undefined;
    return undefined;
  }, [filters.dateFrom, filters.dateTo]);

  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      onFiltersChange({ ...filters, dateFrom: value.customStart, dateTo: value.customEnd });
    } else {
      const { dateFrom, dateTo } = getDateRangeFromPreset(value.preset);
      onFiltersChange({ ...filters, dateFrom, dateTo });
    }
  };

  const kyActive = !!(filters.dateFrom || filters.dateTo);

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_PHIEU_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value,
      })),
    [t]
  );
  const noiDeXuatOptions = useMemo(
    () => khoList.map((k) => ({ label: k.ten_kho, value: k.id, subLabel: k.ma_kho })),
    [khoList]
  );
  const nguoiDeXuatOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
      })),
    [employees]
  );
  const nguoiDuyetOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
      })),
    [employees]
  );

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'trangThaiIds',
        label: t('baoCaodeXuatVatTu.filter.trangThai'),
        icon: Tag,
        options: trangThaiOptions.map((o) => ({ ...o, value: o.value })),
        value: filters.trangThaiIds,
        onChange: (val: string[]) =>
          onFiltersChange({ ...filters, trangThaiIds: val as BaoCaoDeXuatVatTuFilters['trangThaiIds'] }),
      },
      {
        key: 'noiDeXuatIds',
        label: t('baoCaodeXuatVatTu.filter.noiDeXuat'),
        icon: Warehouse,
        options: noiDeXuatOptions.map((o) => ({ ...o, value: o.value })),
        value: filters.noiDeXuatIds,
        onChange: (val: string[]) => onFiltersChange({ ...filters, noiDeXuatIds: val }),
      },
      {
        key: 'nguoiDeXuatIds',
        label: t('baoCaodeXuatVatTu.filter.nguoiDeXuat'),
        icon: User,
        options: nguoiDeXuatOptions.map((o) => ({ ...o, value: o.value })),
        value: filters.nguoiDeXuatIds,
        onChange: (val: string[]) => onFiltersChange({ ...filters, nguoiDeXuatIds: val }),
      },
      {
        key: 'nguoiDuyetIds',
        label: t('baoCaodeXuatVatTu.filter.nguoiDuyet'),
        icon: UserCheck,
        options: nguoiDuyetOptions.map((o) => ({ ...o, value: o.value })),
        value: filters.nguoiDuyetIds,
        onChange: (val: string[]) => onFiltersChange({ ...filters, nguoiDuyetIds: val }),
      },
    ],
    [t, filters, trangThaiOptions, noiDeXuatOptions, nguoiDeXuatOptions, nguoiDuyetOptions, onFiltersChange]
  );

  const filterItems: FilterChipItem[] = [
    {
      kind: 'custom',
      key: 'ky',
      node: (
        <DateRangePicker
          presets={dateRangePresets}
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          placeholder={t('baoCaodeXuatVatTu.filter.periodPlaceholder')}
          customPresetId={CUSTOM_PRESET_ID}
          displayLabel={dateRangeDisplayLabel}
          className="shrink-0"
        />
      ),
    },
    ...filterGroups.map(
      (g, i): FilterChipItem => ({
        kind: 'group',
        group: g,
        className: i === 0 ? 'w-full sm:w-[160px]' : 'w-full sm:w-[180px]',
      })
    ),
  ];

  const handleExport = async (format: 'excel' | 'pdf') => {
    await onExport(format);
  };

  const actions = (
    <div className="flex items-center gap-2">
      <BaoCaoExportDropdown onExport={handleExport} />
    </div>
  );

  return (
    <DashboardToolbar
      onBack={() => window.history.back()}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileFilterExtra={
        <MobileFilterField label={t('baoCaodeXuatVatTu.filter.periodPlaceholder')} icon={Calendar} active={kyActive}>
          <DateRangePicker
            inline
            presets={dateRangePresets}
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            customPresetId={CUSTOM_PRESET_ID}
          />
        </MobileFilterField>
      }
      mobileFilterExtraCount={kyActive ? 1 : 0}
      activeFilterCount={activeFilterCount}
      onClearFilters={onClearAllFilters}
      actions={actions}
      className="print:hidden"
    />
  );
};

export default BaoCaoDeXuatVatTuToolbar;
