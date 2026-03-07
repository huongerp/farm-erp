import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, ListOrdered } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { usePayrollFormGroupStore } from '../store/usePayrollFormGroupStore';
import { getAdminFormTypeOptions } from '../core/constants';
import type { PayrollAdminFormGroup } from '../core/types';

interface Props {
  /** Danh sách nhóm phiếu để đếm count. */
  items?: PayrollAdminFormGroup[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: 0 | 1) => void;
}

const PayrollFormGroupToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany }) => {
  const { t } = useTranslation();
  const {
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
  } = usePayrollFormGroupStore();

  const counts = useMemo(() => {
    const statusCounts: Record<string, number> = { Active: 0, Inactive: 0 };
    const typeCounts: Record<string, number> = {};
    for (const item of items) {
      const statusKey = item.trang_thai === 1 ? 'Active' : 'Inactive';
      if (filters.type.length === 0 || filters.type.includes(item.loai_phieu)) {
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
      }
      if (filters.status.length === 0 || filters.status.includes(statusKey)) {
        typeCounts[item.loai_phieu] = (typeCounts[item.loai_phieu] || 0) + 1;
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
    const base = getAdminFormTypeOptions(t);
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
        label: t('payrollIp.groups.form.type'),
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
        placeholder={t('payrollIp.groups.form.type')}
        icon={ListOrdered}
        className="w-full sm:w-[200px]"
      />
    </>
  );

  const renderActions = (
    <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      searchPlaceholder={t('payrollIp.groups.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      onStatusChangeMany={(status) => onStatusChangeMany(Array.from(selectedIds), status)}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default PayrollFormGroupToolbar;
