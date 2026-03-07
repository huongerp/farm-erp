import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Calendar, ListOrdered, Clock } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getAdminFormTypeOptions } from '../../thiet-lap-cong-luong/core/constants';
import { ADMIN_FORM_SHIFTS, getAdminFormShiftLabel, getAdminFormStatusLabel, ADMIN_FORM_STATUSES } from '../core/constants';
import { useAdminFormFilterCounts } from '../hooks/use-admin-form-filter-counts';
import type { AdminFormRequest } from '../core/types';

interface Props {
  /** Danh sách phiếu người dùng được xem. Count filter chip đếm trên list này. */
  items?: AdminFormRequest[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: { status: string[]; type: string[]; shift: string[]; month: string };
  setFilter: (key: 'status' | 'type' | 'shift' | 'month', value: any) => void;
  columns: ColumnConfig[];
  toggleColumn: (id: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resetColumns: () => void;
  selectedIds: Set<string>;
  clearSelection: () => void;
  onAdd?: () => void;
  onDeleteMany?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
  searchPlaceholder: string;
}

const AdminFormToolbar: React.FC<Props> = ({
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
  onAdd,
  onDeleteMany,
  bulkActions,
  searchPlaceholder,
}) => {
  const { t } = useTranslation();
  const { statusCounts, typeCounts, shiftCounts } = useAdminFormFilterCounts(items, filters);
  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length + filters.type.length + filters.shift.length + (filters.month ? 1 : 0);

  const statusOptions = useMemo(
    () => ADMIN_FORM_STATUSES.map((s) => ({ label: getAdminFormStatusLabel(s, t), value: s, count: statusCounts[s] ?? 0 })),
    [t, statusCounts]
  );
  const typeOptions = useMemo(() => {
    const opts = getAdminFormTypeOptions(t);
    return opts.map((o) => ({ ...o, count: typeCounts[o.value] ?? 0 }));
  }, [t, typeCounts]);
  const shiftOptions = useMemo(
    () => ADMIN_FORM_SHIFTS.map((s) => ({ label: getAdminFormShiftLabel(s, t), value: s, count: shiftCounts[s] ?? 0 })),
    [t, shiftCounts]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('adminForm.store.statusCol'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'type',
        label: t('adminForm.store.typeCol'),
        icon: ListOrdered,
        options: typeOptions,
        value: filters.type,
        onChange: (val: string[]) => setFilter('type', val),
      },
      {
        key: 'shift',
        label: t('adminForm.store.shiftCol'),
        icon: Clock,
        options: shiftOptions,
        value: filters.shift,
        onChange: (val: string[]) => setFilter('shift', val),
      },
    ],
    [filters.status, filters.type, filters.shift, setFilter, statusOptions, typeOptions, shiftOptions, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('adminForm.store.statusCol')}
        icon={Tag}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={typeOptions}
        value={filters.type}
        onChange={(val) => setFilter('type', val)}
        placeholder={t('adminForm.store.typeCol')}
        icon={ListOrdered}
        className="w-full sm:w-[220px]"
      />
      <FilterChipMultiSelect
        options={shiftOptions}
        value={filters.shift}
        onChange={(val) => setFilter('shift', val)}
        placeholder={t('adminForm.store.shiftCol')}
        icon={Clock}
        className="w-full sm:w-[160px]"
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

  const renderActions = onAdd ? (
    <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  ) : null;

  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('type', []);
    setFilter('shift', []);
    setFilter('month', '');
  };

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      bulkActions={bulkActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      searchPlaceholder={searchPlaceholder}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={onDeleteMany ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default AdminFormToolbar;
