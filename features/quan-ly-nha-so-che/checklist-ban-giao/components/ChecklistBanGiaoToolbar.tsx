import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ClipboardList, Plus, Tags } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { TRANG_THAI_CL } from '../core/types';
import type { PhieuTomTatRow } from '../services/checklist-ban-giao-service';
import { useChecklistBanGiaoStore } from '../store/useChecklistBanGiaoStore';

interface Props {
  /** TÓM TẮT toàn bộ phiếu — chip lọc đếm trên toàn bộ dữ liệu. */
  data: PhieuTomTatRow[];
  /** id mẫu → tên mẫu (từ checklist-mau). */
  tenMau: Map<string, string>;
  selectedCount: number;
  onAdd: () => void;
  canCreate?: boolean;
}

const ChecklistBanGiaoToolbar: React.FC<Props> = ({ data, tenMau, selectedCount, onAdd, canCreate = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useChecklistBanGiaoStore);
  const filters = useChecklistBanGiaoStore((s) => s.filters);
  const setFilter = useChecklistBanGiaoStore((s) => s.setFilter);
  const clearSelection = useChecklistBanGiaoStore((s) => s.clearSelection);
  const columns = useChecklistBanGiaoStore((s) => s.columns);
  const toggleColumn = useChecklistBanGiaoStore((s) => s.toggleColumn);
  const reorderColumns = useChecklistBanGiaoStore((s) => s.reorderColumns);
  const resetColumns = useChecklistBanGiaoStore((s) => s.resetColumns);
  const resetColumnWidths = useChecklistBanGiaoStore((s) => s.resetColumnWidths);

  const ngayFrom = filters.ngay_from ?? '';
  const ngayTo = filters.ngay_to ?? '';

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_CL.map((v) => ({
        value: v,
        label: t(`checklistBanGiao.trangThai.${v}`),
        count: data.filter((r) => r.trang_thai === v).length,
      })),
    [data, t]
  );

  const mauOptions = useMemo(() => {
    const dem = new Map<string, number>();
    data.forEach((r) => dem.set(String(r.id_mau), (dem.get(String(r.id_mau)) ?? 0) + 1));
    return [...dem.entries()]
      .map(([id, count]) => ({ value: id, label: tenMau.get(id) ?? `#${id}`, count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [data, tenMau]);

  const dateRangeValue: DateRangeValue = { preset: 'custom', customStart: ngayFrom, customEnd: ngayTo };
  const handleDateRangeChange = (v: DateRangeValue) => {
    setFilter('ngay_from', v.customStart || null);
    setFilter('ngay_to', v.customEnd || null);
  };
  const dateRangeActive = !!ngayFrom || !!ngayTo;
  const dateRangeLabel = ngayFrom && ngayTo ? `${ngayFrom} – ${ngayTo}` : ngayFrom ? `${ngayFrom} – …` : ngayTo ? `… – ${ngayTo}` : '';

  const filterGroups = [
    { key: 'trang_thai', label: t('checklistBanGiao.col.trangThai'), icon: Tags, options: trangThaiOptions, value: filters.trang_thai, onChange: (v: string[]) => setFilter('trang_thai', v) },
    { key: 'id_mau', label: t('checklistBanGiao.col.tenMau'), icon: ClipboardList, options: mauOptions, value: filters.id_mau, onChange: (v: string[]) => setFilter('id_mau', v) },
  ];

  const filterItems: FilterChipItem[] = [
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[150px]' },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[180px]' },
    {
      kind: 'custom',
      key: 'ngay',
      node: (
        <DateRangePicker
          presets={[]}
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          displayLabel={dateRangeLabel}
          placeholder={t('checklistBanGiao.toolbar.filterNgay')}
          className="w-full sm:w-auto"
        />
      ),
    },
  ];

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) + filters.trang_thai.length + filters.id_mau.length + (dateRangeActive ? 1 : 0);

  const clearAllFilters = () => {
    setFilter('trang_thai', []);
    setFilter('id_mau', []);
    setFilter('ngay_from', null);
    setFilter('ngay_to', null);
  };

  const renderActions = canCreate ? (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  ) : undefined;

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
        <MobileFilterField label={t('checklistBanGiao.toolbar.filterNgay')} icon={Calendar} active={dateRangeActive}>
          <DateRangePicker inline presets={[]} value={dateRangeValue} onChange={handleDateRangeChange} />
        </MobileFilterField>
      }
      mobileFilterExtraCount={dateRangeActive ? 1 : 0}
      onAdd={canCreate ? onAdd : undefined}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={clearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default ChecklistBanGiaoToolbar;
