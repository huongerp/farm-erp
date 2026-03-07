import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ListOrdered } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getAdminFormTypeOptions } from '../../thiet-lap-cong-luong/core/constants';
import type { AdminFormQuotaRow } from '../core/types';

interface Props {
  /** Danh sách dòng quota để đếm count theo loại phiếu. */
  items?: AdminFormQuotaRow[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: { type: string[]; month: string };
  setFilter: (key: 'type' | 'month', value: any) => void;
  columns: ColumnConfig[];
  toggleColumn: (id: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resetColumns: () => void;
  selectedIds: Set<string>;
  clearSelection: () => void;
  searchPlaceholder: string;
}

const AdminFormQuotaToolbar: React.FC<Props> = ({
  items = [],
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
  searchPlaceholder,
}) => {
  const { t } = useTranslation();
  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.type.length + (filters.month ? 1 : 0);
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const row of items) {
      if (row.loai_phieu) m[row.loai_phieu] = (m[row.loai_phieu] || 0) + 1;
    }
    return m;
  }, [items]);
  const typeOptions = useMemo(
    () => getAdminFormTypeOptions(t).map((o) => ({ ...o, count: typeCounts[o.value] ?? 0 })),
    [t, typeCounts]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'type',
        label: t('adminForm.store.typeCol'),
        icon: ListOrdered,
        options: typeOptions,
        value: filters.type,
        onChange: (val: string[]) => setFilter('type', val),
      },
    ],
    [filters.type, setFilter, typeOptions, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={typeOptions}
        value={filters.type}
        onChange={(val) => setFilter('type', val)}
        placeholder={t('adminForm.store.typeCol')}
        icon={ListOrdered}
        className="w-full sm:w-[220px]"
      />
      <div className="relative w-full sm:w-[170px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="month"
          value={filters.month}
          onChange={(e) => setFilter('month', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>
    </>
  );

  const handleClearAllFilters = () => {
    setFilter('type', []);
    setFilter('month', '');
  };

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      filters={renderFilters}
      filterGroups={filterGroups}
      searchPlaceholder={searchPlaceholder}
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

export default AdminFormQuotaToolbar;
