import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, Calendar, Warehouse, ToggleLeft } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { getDateRangeFromPreset, getPresetFromDates } from '../../../../lib/date-presets';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useKiemKeKhoStore } from '../store/useKiemKeKhoStore';
import { useEmployeesRefQuery } from '@/lib/hooks/use-ref-queries';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { TRANG_THAI_DOT_OPTIONS } from '../core/constants';
import { useKiemKeKhoFilterCounts } from '../hooks/use-kiem-ke-kho-filter-counts';
import type { DotKiemKeKhoTomTat } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';

const CUSTOM_PRESET_ID = 'custom';

interface Props {
  /**
   * Tóm tắt TOÀN BỘ đợt trong phạm vi xem (không phải trang đang xem) — chip lọc
   * phải đếm trên toàn bộ dữ liệu, xem `getDotKiemKeKhoTomTat`.
   */
  tomTat?: DotKiemKeKhoTomTat[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  showAdd?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

const KiemKeKhoToolbar: React.FC<Props> = ({
  tomTat = [],
  onAdd,
  onDeleteMany,
  showAdd = true,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useKiemKeKhoStore);
  const filters = useKiemKeKhoStore((s) => s.filters);
  const setFilter = useKiemKeKhoStore((s) => s.setFilter);
  const resetFilters = useKiemKeKhoStore((s) => s.resetFilters);
  const columns = useKiemKeKhoStore((s) => s.columns);
  const toggleColumn = useKiemKeKhoStore((s) => s.toggleColumn);
  const reorderColumns = useKiemKeKhoStore((s) => s.reorderColumns);
  const resetColumns = useKiemKeKhoStore((s) => s.resetColumns);
  const resetColumnWidths = useKiemKeKhoStore((s) => s.resetColumnWidths);
  const selectedIds = useKiemKeKhoStore((s) => s.selectedIds);
  const clearSelection = useKiemKeKhoStore((s) => s.clearSelection);
  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: khoList = [] } = useKhoList();
  const { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts } = useKiemKeKhoFilterCounts(tomTat, filters);

  const selectedCount = selectedIds.size;
  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_DOT_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value as string,
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
    () => ({
      preset: getPresetFromDates(filters.dateFrom, filters.dateTo),
      customStart: filters.dateFrom,
      customEnd: filters.dateTo,
    }),
    [filters.dateFrom, filters.dateTo]
  );
  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      setFilter('dateFrom', value.customStart);
      setFilter('dateTo', value.customEnd);
      return;
    }
    const { dateFrom, dateTo } = getDateRangeFromPreset(value.preset);
    setFilter('dateFrom', dateFrom);
    setFilter('dateTo', dateTo);
  };

  const activeFilterCount =
    filters.trang_thai_dot.length +
    filters.id_nguoi_phu_trach.length +
    filters.id_kho.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
  const handleClearAllFilters = () => resetFilters();

  /**
   * Bộ lọc mobile (bottom-sheet) phải có ĐỦ các bộ lọc của hàng chip desktop — thiếu cái nào
   * thì trên điện thoại không lọc được theo tiêu chí đó. Kỳ không phải nhóm chọn nên đi qua
   * `mobileFilterExtra` (DateRangePicker inline — có cả khoảng tự chọn).
   */
  const filterGroups = useMemo(
    () => [
      { key: 'trang_thai_dot', label: t('kiemKeKho.store.trangThaiCol'), icon: ToggleLeft, options: trangThaiOptions, value: filters.trang_thai_dot, onChange: (val: string[]) => setFilter('trang_thai_dot', val) },
      { key: 'id_kho', label: t('kiemKeKho.store.khoCol'), icon: Warehouse, options: idKhoOptions, value: filters.id_kho, onChange: (val: string[]) => setFilter('id_kho', val) },
      { key: 'id_nguoi_phu_trach', label: t('kiemKeKho.store.nguoiPhuTrachCol'), icon: User, options: nguoiPhuTrachOptions, value: filters.id_nguoi_phu_trach, onChange: (val: string[]) => setFilter('id_nguoi_phu_trach', val) },
    ],
    [trangThaiOptions, idKhoOptions, nguoiPhuTrachOptions, filters.trang_thai_dot, filters.id_kho, filters.id_nguoi_phu_trach, setFilter, t]
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
          placeholder={t('kiemKeKho.filter.periodPlaceholder')}
          customPresetId={CUSTOM_PRESET_ID}
          className="shrink-0"
        />
      ),
    },
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: filterGroups[2], className: 'w-full sm:w-[180px]' },
  ];

  const dateFilterActive = !!(filters.dateFrom || filters.dateTo);
  const mobileFilterExtra = (
    <MobileFilterField label={t('kiemKeKho.filter.periodPlaceholder')} icon={Calendar} active={dateFilterActive}>
      <DateRangePicker
        inline
        presets={dateRangePresets}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        customPresetId={CUSTOM_PRESET_ID}
      />
    </MobileFilterField>
  );

  const showAddButton = showAdd && canCreate;
  const renderActions = (
    <div className="flex items-center gap-2">
      {showAddButton && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('kiemKeKho.addDot')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => (showAddButton ? [{ label: t('kiemKeKho.addDot'), icon: Plus, onClick: onAdd }] : []),
    [t, onAdd, showAddButton]
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileFilterExtra={mobileFilterExtra}
      mobileFilterExtraCount={dateFilterActive ? 1 : 0}
      onAdd={canCreate ? onAdd : undefined}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && selectedCount > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
      mobileActions={mobileActions}
    />
  );
};

export default KiemKeKhoToolbar;
