import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, ListOrdered } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { usePayrollPointGroupStore } from '../store/usePayrollPointGroupStore';
import { getPointGroupTypeOptions } from '../core/constants';
import type { PayrollPointGroup } from '../core/types';

interface Props {
  /** Danh sách nhóm điểm để đếm count. */
  items?: PayrollPointGroup[];
  onAdd?: () => void;
  onDeleteMany?: (ids: string[]) => void;
  onStatusChangeMany?: (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const PayrollPointGroupToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany, canCreate = true, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(usePayrollPointGroupStore);
  const filters = usePayrollPointGroupStore((s) => s.filters);
  const setFilter = usePayrollPointGroupStore((s) => s.setFilter);
  const columns = usePayrollPointGroupStore((s) => s.columns);
  const toggleColumn = usePayrollPointGroupStore((s) => s.toggleColumn);
  const reorderColumns = usePayrollPointGroupStore((s) => s.reorderColumns);
  const resetColumns = usePayrollPointGroupStore((s) => s.resetColumns);
  const selectedIds = usePayrollPointGroupStore((s) => s.selectedIds);
  const clearSelection = usePayrollPointGroupStore((s) => s.clearSelection);

  const counts = useMemo(() => {
    const statusCounts: Record<string, number> = { Active: 0, Inactive: 0 };
    const typeCounts: Record<string, number> = {};
    for (const item of items) {
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      if (filters.type.length === 0 || filters.type.includes(item.loai)) {
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
      }
      if (filters.status.length === 0 || filters.status.includes(statusKey)) {
        typeCounts[item.loai] = (typeCounts[item.loai] || 0) + 1;
      }
    }
    return { statusCounts, typeCounts };
  }, [items, filters.status, filters.type]);

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length + filters.type.length;
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('type', []);
  };

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: counts.statusCounts['Active'] ?? 0 },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: counts.statusCounts['Inactive'] ?? 0 },
    ],
    [t, counts.statusCounts]
  );
  const typeOptions = useMemo(() => {
    const base = getPointGroupTypeOptions(t);
    return base.map((o) => ({ ...o, count: counts.typeCounts[o.value] ?? 0 }));
  }, [t, counts.typeCounts]);

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
      {
        key: 'type',
        label: t('payrollIp.pointGroups.form.loai'),
        icon: ListOrdered,
        options: typeOptions,
        value: filters.type,
        onChange: (val: string[]) => setFilter('type', val),
      },
    ],
    [filters.status, filters.type, setFilter, statusOptions, typeOptions, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={typeOptions}
        value={filters.type}
        onChange={(val) => setFilter('type', val)}
        placeholder={t('payrollIp.pointGroups.form.loai')}
        icon={ListOrdered}
        className="w-full sm:w-[160px]"
      />
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
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      searchPlaceholder={t('payrollIp.pointGroups.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && onDeleteMany ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      onStatusChangeMany={canUpdate && onStatusChangeMany ? (numStatus) => onStatusChangeMany(Array.from(selectedIds), numStatus === 1 ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default PayrollPointGroupToolbar;
