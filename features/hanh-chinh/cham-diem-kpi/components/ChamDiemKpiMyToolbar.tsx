import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, Target } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useChamDiemKpiMyStore } from '../store/useChamDiemKpiMyStore';
import { getDanhGiaKpiLabel } from '../core/constants';
import type { ChamDiemKpiRecord } from '../core/types';

interface Props {
  /** Danh sách bản ghi chấm KPI (của tôi) để đếm count. */
  items?: ChamDiemKpiRecord[];
  onAdd: () => void;
  onDeleteMany?: (ids: string[]) => void;
}

const DANH_GIA_OPTIONS = (t: (key: string) => string) => [
  { value: 'dat', label: getDanhGiaKpiLabel('dat', t) },
  { value: 'khong_dat', label: getDanhGiaKpiLabel('khong_dat', t) },
];

const ChamDiemKpiMyToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
}) => {
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
    selectedIds,
    clearSelection,
  } = useChamDiemKpiMyStore();

  const danhGiaCounts = useMemo(() => {
    const m: Record<string, number> = {};
    const periodStr = (r: ChamDiemKpiRecord) => `${r.nam}-${String(r.thang).padStart(2, '0')}`;
    for (const r of items) {
      const matchYearMonth = !filters.yearMonth || periodStr(r).startsWith(filters.yearMonth);
      if (matchYearMonth && r.danh_gia) m[r.danh_gia] = (m[r.danh_gia] || 0) + 1;
    }
    return m;
  }, [items, filters.yearMonth]);

  const activeFilterCount =
    filters.danhGia.length + (filters.yearMonth ? 1 : 0);
  const handleClearAllFilters = () => {
    setFilter('danhGia', []);
    setFilter('yearMonth', '');
  };

  const danhGiaOptions = useMemo(
    () => DANH_GIA_OPTIONS(t).map((o) => ({ ...o, count: danhGiaCounts[o.value] ?? 0 })),
    [t, danhGiaCounts]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={danhGiaOptions}
        value={filters.danhGia}
        onChange={(val) => setFilter('danhGia', val)}
        placeholder={t('chamDiemKpi.store.danhGiaCol')}
        icon={Target}
        className="w-full sm:w-[140px]"
      />
      <div className="relative w-full sm:w-[160px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="month"
          value={filters.yearMonth}
          onChange={(e) => setFilter('yearMonth', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>
    </>
  );

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={[]}
      onAdd={onAdd}
      searchPlaceholder={t('chamDiemKpi.my.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={
        onDeleteMany && selectedIds.size > 0
          ? () => onDeleteMany(Array.from(selectedIds))
          : undefined
      }
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default ChamDiemKpiMyToolbar;
