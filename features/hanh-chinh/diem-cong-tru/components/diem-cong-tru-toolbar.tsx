import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, ListOrdered } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useDiemCongTruStore } from '../store/useDiemCongTruStore';
import { useDiemCongTruFilterCounts } from '../hooks/use-diem-cong-tru-filter-counts';
import { getDiemCongTruLoaiOptions } from '../core/constants';
import type { DiemCongTruRecord } from '../core/types';

interface Props {
  /** Danh sách bản ghi để đếm count theo loại. */
  items?: DiemCongTruRecord[];
  onAdd?: () => void;
  onDeleteMany?: (ids: string[]) => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const DiemCongTruToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, canCreate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useDiemCongTruStore);
  const filters = useDiemCongTruStore((s) => s.filters);
  const setFilter = useDiemCongTruStore((s) => s.setFilter);
  const columns = useDiemCongTruStore((s) => s.columns);
  const toggleColumn = useDiemCongTruStore((s) => s.toggleColumn);
  const reorderColumns = useDiemCongTruStore((s) => s.reorderColumns);
  const resetColumns = useDiemCongTruStore((s) => s.resetColumns);
  const selectedIds = useDiemCongTruStore((s) => s.selectedIds);
  const clearSelection = useDiemCongTruStore((s) => s.clearSelection);
  const { typeCounts } = useDiemCongTruFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.type.length + (filters.yearMonth ? 1 : 0);
  const handleClearAllFilters = () => {
    setFilter('type', []);
    setFilter('yearMonth', '');
  };

  const typeOptions = useMemo(
    () => getDiemCongTruLoaiOptions(t).map((o) => ({ ...o, count: typeCounts[o.value] ?? 0 })),
    [t, typeCounts]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={typeOptions}
        value={filters.type}
        onChange={(val) => setFilter('type', val)}
        placeholder={t('diemCongTru.form.loai')}
        icon={ListOrdered}
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

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={[]}
      onAdd={canCreate ? onAdd : undefined}
      searchPlaceholder={t('diemCongTru.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && onDeleteMany ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default DiemCongTruToolbar;
