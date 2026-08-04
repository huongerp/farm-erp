import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Building2, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useBangLuongManagedStore } from '../store/useBangLuongManagedStore';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import type { BangLuongRecord } from '../core/types';

interface Props {
  /** Danh sách bản ghi bảng lương để đếm count theo phòng ban. */
  items?: BangLuongRecord[];
  onAdd?: () => void;
  onClearSelection: () => void;
  selectedCount: number;
  onDeleteMany?: (ids: string[]) => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const BangLuongManagedToolbar: React.FC<Props> = ({ items = [], onAdd, onClearSelection, selectedCount, onDeleteMany, canCreate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useBangLuongManagedStore);
  const filters = useBangLuongManagedStore((s) => s.filters);
  const setFilter = useBangLuongManagedStore((s) => s.setFilter);
  const columns = useBangLuongManagedStore((s) => s.columns);
  const toggleColumn = useBangLuongManagedStore((s) => s.toggleColumn);
  const reorderColumns = useBangLuongManagedStore((s) => s.reorderColumns);
  const resetColumns = useBangLuongManagedStore((s) => s.resetColumns);
  const selectedIds = useBangLuongManagedStore((s) => s.selectedIds);
  const { data: departments = [] } = useDepartments();

  const phongCounts = useMemo(() => {
    const m: Record<string, number> = {};
    const periodStr = (r: BangLuongRecord) => `${r.nam}-${String(r.thang).padStart(2, '0')}`;
    for (const r of items) {
      const matchYearMonth = !filters.yearMonth || periodStr(r).startsWith(filters.yearMonth);
      if (matchYearMonth && r.id_phong_ban) m[r.id_phong_ban] = (m[r.id_phong_ban] || 0) + 1;
    }
    return m;
  }, [items, filters.yearMonth]);
  const phongOptions = useMemo(
    () =>
      departments
        .filter((d) => d.cap_do === 1)
        .map((d) => ({ label: d.ten_phong_ban, value: d.id, count: phongCounts[d.id] ?? 0 })),
    [departments, phongCounts]
  );

  const activeFilterCount = (filters.yearMonth ? 1 : 0) + filters.phongBan.length;
  const handleClearAllFilters = () => {
    setFilter('yearMonth', '');
    setFilter('phongBan', []);
  };

  const renderActions = canCreate && onAdd ? (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  ) : null;

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={phongOptions}
        value={filters.phongBan}
        onChange={(val) => setFilter('phongBan', val)}
        placeholder={t('bangLuong.filter.phong')}
        icon={Building2}
        className="w-full sm:w-[160px]"
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

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={onClearSelection}
      actions={renderActions}
      filters={renderFilters}
      onDeleteMany={canDelete && onDeleteMany && selectedIds.size > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      filterGroups={[]}
      searchPlaceholder={t('bangLuong.managed.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default BangLuongManagedToolbar;
