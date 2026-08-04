import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useBangLuongMyStore } from '../store/useBangLuongMyStore';

interface Props {
  onAdd?: () => void;
  onClearSelection: () => void;
  selectedCount: number;
  onDeleteMany?: (ids: string[]) => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const BangLuongMyToolbar: React.FC<Props> = ({ onAdd, onClearSelection, selectedCount, onDeleteMany, canCreate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useBangLuongMyStore);
  const filters = useBangLuongMyStore((s) => s.filters);
  const setFilter = useBangLuongMyStore((s) => s.setFilter);
  const columns = useBangLuongMyStore((s) => s.columns);
  const toggleColumn = useBangLuongMyStore((s) => s.toggleColumn);
  const reorderColumns = useBangLuongMyStore((s) => s.reorderColumns);
  const resetColumns = useBangLuongMyStore((s) => s.resetColumns);
  const selectedIds = useBangLuongMyStore((s) => s.selectedIds);

  const activeFilterCount = filters.yearMonth ? 1 : 0;
  const handleClearAllFilters = () => setFilter('yearMonth', '');

  const renderFilters = (
    <div className="relative w-full sm:w-[160px]">
      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="month"
        value={filters.yearMonth}
        onChange={(e) => setFilter('yearMonth', e.target.value)}
        className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
      />
    </div>
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
      onClearSelection={onClearSelection}
      actions={renderActions}
      filters={renderFilters}
      onDeleteMany={canDelete && onDeleteMany && selectedIds.size > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      filterGroups={[]}
      searchPlaceholder={t('bangLuong.my.searchPlaceholder')}
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

export default BangLuongMyToolbar;
