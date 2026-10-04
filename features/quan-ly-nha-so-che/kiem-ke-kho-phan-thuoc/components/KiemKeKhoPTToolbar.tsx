import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, Calendar, Warehouse, ToggleLeft, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import { getDateRangeFromPreset, getPresetFromDates } from '../../../../lib/date-presets';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useEmployeesRefQuery } from '@/lib/hooks/use-ref-queries';
import { useKhoList } from '../../../kho-van/danh-sach-kho/hooks/use-kho';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { TRANG_THAI_DOT_OPTIONS_PT } from '../core/constants';
import { useKiemKeKhoPTStore } from '../store/useKiemKeKhoPTStore';
import type { DotKiemKePTTomTat } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';

const CUSTOM_PRESET_ID = 'custom';

interface Props {
  /**
   * Tóm tắt TOÀN BỘ đợt trong phạm vi xem (không phải trang đang xem) — chip lọc
   * phải đếm trên toàn bộ dữ liệu, xem `getDotKiemKePTTomTat`.
   */
  tomTat?: DotKiemKePTTomTat[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onExport?: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

/** Đếm cho chip lọc — tính trên bản tóm tắt toàn bộ. */
function useFilterCounts(items: DotKiemKePTTomTat[]) {
  return useMemo(() => {
    const trangThaiCounts: Record<string, number> = {};
    const nguoiPhuTrachCounts: Record<string, number> = {};
    const idKhoCounts: Record<string, number> = {};
    items.forEach((d) => {
      trangThaiCounts[d.trang_thai] = (trangThaiCounts[d.trang_thai] ?? 0) + 1;
      nguoiPhuTrachCounts[d.id_nguoi_phu_trach] = (nguoiPhuTrachCounts[d.id_nguoi_phu_trach] ?? 0) + 1;
      d.id_kho.forEach((k) => {
        idKhoCounts[k] = (idKhoCounts[k] ?? 0) + 1;
      });
    });
    return { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts };
  }, [items]);
}

const KiemKeKhoPTToolbar: React.FC<Props> = ({
  tomTat = [],
  onAdd,
  onDeleteMany,
  onExport,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useKiemKeKhoPTStore);
  const filters = useKiemKeKhoPTStore((s) => s.filters);
  const setFilter = useKiemKeKhoPTStore((s) => s.setFilter);
  const resetFilters = useKiemKeKhoPTStore((s) => s.resetFilters);
  const columns = useKiemKeKhoPTStore((s) => s.columns);
  const toggleColumn = useKiemKeKhoPTStore((s) => s.toggleColumn);
  const reorderColumns = useKiemKeKhoPTStore((s) => s.reorderColumns);
  const resetColumns = useKiemKeKhoPTStore((s) => s.resetColumns);
  const resetColumnWidths = useKiemKeKhoPTStore((s) => s.resetColumnWidths);
  const selectedIds = useKiemKeKhoPTStore((s) => s.selectedIds);
  const clearSelection = useKiemKeKhoPTStore((s) => s.clearSelection);

  const { data: employees = [] } = useEmployeesRefQuery();
  const { data: khoList = [] } = useKhoList();
  const { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts } = useFilterCounts(tomTat);

  const selectedCount = selectedIds.size;

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_DOT_OPTIONS_PT.map((o) => ({
        label: t(o.labelKey),
        value: o.value as string,
        count: trangThaiCounts[o.value] ?? 0,
      })),
    [t, trangThaiCounts]
  );
  const khoOptions = useMemo(
    () =>
      khoList
        .filter((k) => k.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((k) => ({ label: k.ten_kho, value: k.id, subLabel: k.ma_kho, count: idKhoCounts[k.id] ?? 0 })),
    [khoList, idKhoCounts]
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

  const dateRangePresets = useMemo(
    () => [
      { id: 'all', label: t('kiemKeKhoPT.filter.periodPlaceholder') },
      { id: 'thisMonth', label: t('kiemKeKhoPT.preset.thisMonth') },
      { id: 'lastMonth', label: t('kiemKeKhoPT.preset.lastMonth') },
      { id: 'thisQuarter', label: t('kiemKeKhoPT.preset.thisQuarter') },
      { id: 'thisYear', label: t('kiemKeKhoPT.preset.thisYear') },
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
  const apDungKy = (presetId: string) => {
    const { dateFrom, dateTo } = getDateRangeFromPreset(presetId);
    setFilter('dateFrom', dateFrom);
    setFilter('dateTo', dateTo);
  };
  const handleDateRangeChange = (value: DateRangeValue) => {
    if (value.preset === CUSTOM_PRESET_ID) {
      setFilter('dateFrom', value.customStart);
      setFilter('dateTo', value.customEnd);
      return;
    }
    apDungKy(value.preset);
  };

  const activeFilterCount =
    filters.trang_thai.length +
    filters.id_nguoi_phu_trach.length +
    filters.id_kho.length +
    (filters.dateFrom || filters.dateTo ? 1 : 0);

  /** Kỳ không nằm ở đây — mobile dùng DateRangePicker inline qua `mobileFilterExtra`. */
  const filterGroups = useMemo(
    () => [
      {
        key: 'trang_thai',
        label: t('kiemKeKhoPT.store.trangThaiCol'),
        icon: ToggleLeft,
        options: trangThaiOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
      {
        key: 'id_kho',
        label: t('kiemKeKhoPT.store.khoCol'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.id_kho,
        onChange: (val: string[]) => setFilter('id_kho', val),
      },
      {
        key: 'id_nguoi_phu_trach',
        label: t('kiemKeKhoPT.store.nguoiPhuTrachCol'),
        icon: User,
        options: nguoiPhuTrachOptions,
        value: filters.id_nguoi_phu_trach,
        onChange: (val: string[]) => setFilter('id_nguoi_phu_trach', val),
      },
    ],
    [t, trangThaiOptions, khoOptions, nguoiPhuTrachOptions, filters, setFilter]
  );
  const kyActive = !!(filters.dateFrom || filters.dateTo);

  const [trangThaiGroup, khoGroup, nguoiPhuTrachGroup] = filterGroups;
  const filterItems: FilterChipItem[] = [
    {
      kind: 'custom',
      key: 'ky',
      node: (
        <DateRangePicker
          presets={dateRangePresets}
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          placeholder={t('kiemKeKhoPT.filter.periodPlaceholder')}
          customPresetId={CUSTOM_PRESET_ID}
          className="shrink-0"
        />
      ),
    },
    { kind: 'group', group: trangThaiGroup, className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: khoGroup, className: 'w-full sm:w-[160px]' },
    { kind: 'group', group: nguoiPhuTrachGroup, className: 'w-full sm:w-[180px]' },
  ];

  const renderActions = (
    <div className="flex items-center gap-2">
      {onExport && (
        <Tooltip content={t('kiemKeKhoPT.toolbar.export')} placement="bottom">
          <Button
            onClick={onExport}
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            aria-label={t('kiemKeKhoPT.toolbar.export')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {canCreate && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('kiemKeKhoPT.addDot')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];
    if (canCreate) items.push({ label: t('kiemKeKhoPT.addDot'), icon: Plus, onClick: onAdd });
    if (onExport) items.push({ label: t('kiemKeKhoPT.toolbar.export'), icon: Download, onClick: onExport });
    return items;
  }, [t, onAdd, onExport, canCreate]);

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileFilterExtra={
        <MobileFilterField label={t('kiemKeKhoPT.filter.periodPlaceholder')} icon={Calendar} active={kyActive}>
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
      onAdd={canCreate ? onAdd : undefined}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={resetFilters}
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

export default KiemKeKhoPTToolbar;
