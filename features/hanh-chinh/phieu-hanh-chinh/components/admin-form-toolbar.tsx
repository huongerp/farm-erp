import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Calendar, ListOrdered, User, ChevronDown } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getAdminFormTypeOptions } from '../../thiet-lap-cong-luong/core/constants';
import { getAdminFormStatusLabel, ADMIN_FORM_STATUSES } from '../core/constants';
import { useAdminFormFilterCounts } from '../hooks/use-admin-form-filter-counts';
import type { AdminFormTomTat } from '../core/types';
import type { AdminFormListFilters } from '../store/useAdminFormListStore';

/** Preset thời gian: mặc định Tất cả (không lọc theo tháng) */
function getMonthPresetOptions(t: (key: string) => string) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
  return [
    { value: '', label: t('adminForm.filter.timeAll') },
    { value: thisMonth, label: t('adminForm.filter.thisMonth') },
    { value: lastMonth, label: t('adminForm.filter.lastMonth') },
  ];
}

interface Props {
  /** Bản vài cột của toàn bộ phạm vi xem — chip lọc đếm trên list này. */
  tomTat: AdminFormTomTat[];
  /** Hiện chip Người gửi (người có viewAll). */
  showPersonFilter: boolean;
  currentUserId: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: AdminFormListFilters;
  setFilter: (key: keyof AdminFormListFilters, value: any) => void;
  columns: ColumnConfig[];
  toggleColumn: (id: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resetColumns: () => void;
  resetColumnWidths: () => void;
  selectedIds: Set<string>;
  clearSelection: () => void;
  onAdd?: () => void;
  onDeleteMany?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
}

const AdminFormToolbar: React.FC<Props> = ({
  tomTat,
  showPersonFilter,
  currentUserId,
  searchTerm,
  setSearchTerm,
  filters,
  setFilter,
  columns,
  toggleColumn,
  reorderColumns,
  resetColumns,
  resetColumnWidths,
  selectedIds,
  clearSelection,
  onAdd,
  onDeleteMany,
  bulkActions,
}) => {
  const { t } = useTranslation();
  const { statusCounts, typeCounts, nguoiTaoCounts, nguoiGuiOptions } = useAdminFormFilterCounts(tomTat, filters);
  const selectedCount = selectedIds.size;
  const nguoiTao = filters.nguoiTao ?? [];
  const activeFilterCount =
    filters.status.length + filters.type.length + (showPersonFilter ? nguoiTao.length : 0) + (filters.month ? 1 : 0);

  const statusOptions = useMemo(
    () => ADMIN_FORM_STATUSES.map((s) => ({ label: getAdminFormStatusLabel(s, t), value: s, count: statusCounts[s] ?? 0 })),
    [t, statusCounts]
  );
  const typeOptions = useMemo(() => {
    const opts = getAdminFormTypeOptions(t);
    return opts.map((o) => ({ ...o, count: typeCounts[o.value] ?? 0 }));
  }, [t, typeCounts]);
  // Chính mình đứng đầu kèm "(Tôi)", còn lại theo tên.
  const personOptions = useMemo(() => {
    const opts = nguoiGuiOptions.map((p) => ({
      value: p.id,
      label: p.id === currentUserId ? `${p.ten || p.id} (${t('adminForm.filter.me')})` : p.ten || p.id,
      count: nguoiTaoCounts[p.id] ?? 0,
    }));
    return opts.sort((a, b) =>
      a.value === currentUserId ? -1 : b.value === currentUserId ? 1 : a.label.localeCompare(b.label, 'vi')
    );
  }, [nguoiGuiOptions, nguoiTaoCounts, currentUserId, t]);

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
      ...(showPersonFilter
        ? [
            {
              key: 'nguoiTao',
              label: t('adminForm.store.requesterCol'),
              icon: User,
              options: personOptions,
              value: nguoiTao,
              onChange: (val: string[]) => setFilter('nguoiTao', val),
            },
          ]
        : []),
    ],
    [filters.status, filters.type, nguoiTao, showPersonFilter, setFilter, statusOptions, typeOptions, personOptions, t]
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
      {showPersonFilter && (
        <FilterChipMultiSelect
          options={personOptions}
          value={nguoiTao}
          onChange={(val) => setFilter('nguoiTao', val)}
          placeholder={t('adminForm.store.requesterCol')}
          icon={User}
          className="w-full sm:w-[200px]"
        />
      )}
      <div className="relative w-full sm:w-[170px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
        <select
          value={filters.month}
          onChange={(e) => setFilter('month', e.target.value)}
          className="w-full h-9 pl-8 pr-8 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer"
        >
          {getMonthPresetOptions(t).map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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
    setFilter('nguoiTao', []);
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
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={onDeleteMany ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default AdminFormToolbar;
