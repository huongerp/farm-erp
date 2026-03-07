import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import { useHoSoStore } from '../store/useHoSoStore';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

export interface FilterChipItem {
  key: string;
  label: string;
  valueLabel: string;
}

interface Props {
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  filterChips?: FilterChipItem[];
  onRemoveFilter?: (key: string) => void;
  onClearAllFilters?: () => void;
  activeFilterCount?: number;
  filterGroups?: FilterGroup[];
}

const HoSoToolbar: React.FC<Props> = ({
  onAdd,
  onDeleteMany,
  filterChips = [],
  onRemoveFilter,
  onClearAllFilters,
  activeFilterCount = 0,
  filterGroups,
}) => {
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    selectedIds,
    clearSelection,
  } = useHoSoStore();

  const selectedCount = selectedIds.size;

  const filtersSlot =
    filterChips.length > 0 && onRemoveFilter ? (
      <div className="flex flex-wrap items-center gap-1.5">
        {filterChips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
          >
            <span className="text-muted-foreground">{chip.label}:</span>
            <span>{chip.valueLabel}</span>
            <button
              type="button"
              onClick={() => onRemoveFilter(chip.key)}
              className="p-0.5 rounded hover:bg-primary/20 transition-colors"
              aria-label={t('common.clearFilter')}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    ) : undefined;

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      }
      searchPlaceholder={t('hoSo.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={onClearAllFilters}
      filters={filtersSlot}
      filterGroups={filterGroups}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default HoSoToolbar;
