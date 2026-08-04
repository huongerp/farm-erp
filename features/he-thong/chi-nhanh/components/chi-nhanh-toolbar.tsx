import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useBranchStore } from '../store/useBranchStore';
import { TRANG_THAI, type TrangThai } from '../../../../lib/constants';

interface Props {
  /** Danh sách chi nhánh. Count filter chip đếm trên list này. */
  items?: { trang_thai: string }[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: TrangThai) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const BranchToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany, canCreate = true, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useBranchStore);
  const filters = useBranchStore((s) => s.filters);
  const setFilter = useBranchStore((s) => s.setFilter);
  const columns = useBranchStore((s) => s.columns);
  const toggleColumn = useBranchStore((s) => s.toggleColumn);
  const reorderColumns = useBranchStore((s) => s.reorderColumns);
  const resetColumns = useBranchStore((s) => s.resetColumns);
  const selectedIds = useBranchStore((s) => s.selectedIds);
  const clearSelection = useBranchStore((s) => s.clearSelection);

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length;
  const handleClearAllFilters = () => setFilter('status', []);

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: items.filter((i) => i.trang_thai === TRANG_THAI.DANG_DUNG).length },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: items.filter((i) => i.trang_thai === TRANG_THAI.NGUNG).length },
    ],
    [t, items]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
    ],
    [filters.status, setFilter, statusOptions, t]
  );

  const renderFilters = (
    <FilterChipMultiSelect
      options={statusOptions}
      value={filters.status}
      onChange={(val) => setFilter('status', val)}
      placeholder={t('common.status')}
      icon={Tag}
      className="w-full sm:w-[140px]"
    />
  );

  const renderActions = (
    canCreate ? (
      <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
        <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('common.addNew')}</span>
      </Button>
    ) : null
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      searchPlaceholder={t('branch.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      onStatusChangeMany={canUpdate ? (numStatus) => onStatusChangeMany(Array.from(selectedIds), numStatus === 1 ? TRANG_THAI.DANG_DUNG : TRANG_THAI.NGUNG) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default BranchToolbar;
