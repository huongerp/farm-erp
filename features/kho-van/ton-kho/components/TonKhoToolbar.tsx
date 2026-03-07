import React from 'react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

interface TonKhoToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder: string;
  columns: ColumnConfig[];
  onToggleColumn: (id: string) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  onResetColumns: () => void;
  filters?: React.ReactNode;
  activeFilterCount?: number;
  onClearAllFilters?: () => void;
  filterGroups?: FilterGroup[];
}

/**
 * Toolbar chuẩn cho module Tồn kho (chỉ xem): search + filter chips + quản lý cột.
 */
const TonKhoToolbar: React.FC<TonKhoToolbarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  columns,
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
  filters,
  activeFilterCount = 0,
  onClearAllFilters,
  filterGroups,
}) => {
  return (
    <GenericToolbar
      selectedCount={0}
      onClearSelection={() => {}}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      showBack
      actions={null}
      filters={filters}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={onClearAllFilters}
      filterGroups={filterGroups}
      columns={columns}
      onToggleColumn={onToggleColumn}
      onReorderColumns={onReorderColumns}
      onResetColumns={onResetColumns}
    />
  );
};

export default TonKhoToolbar;
