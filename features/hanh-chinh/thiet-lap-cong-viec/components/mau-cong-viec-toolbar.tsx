import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, ListOrdered } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useMauCongViecStore } from '../store/useMauCongViecStore';
import { getUuTienOptions } from '../core/constants';
import type { MauCongViec } from '../core/types';

interface Props {
  /** Danh sách mẫu công việc để đếm count. */
  items?: MauCongViec[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: 0 | 1) => void;
}

const MauCongViecToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany }) => {
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
  } = useMauCongViecStore();

  const counts = useMemo(() => {
    const statusCounts: Record<string, number> = { Active: 0, Inactive: 0 };
    const uuTienCounts: Record<string, number> = {};
    for (const item of items) {
      const statusKey = item.trang_thai_mac_dinh === 1 ? 'Active' : 'Inactive';
      if (filters.uu_tien.length === 0 || filters.uu_tien.includes(item.uu_tien_mac_dinh)) {
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
      }
      if (filters.status.length === 0 || filters.status.includes(statusKey)) {
        uuTienCounts[item.uu_tien_mac_dinh] = (uuTienCounts[item.uu_tien_mac_dinh] || 0) + 1;
      }
    }
    return { statusCounts, uuTienCounts };
  }, [items, filters.status, filters.uu_tien]);

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length + filters.uu_tien.length;
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('uu_tien', []);
  };

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: counts.statusCounts['Active'] ?? 0 },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: counts.statusCounts['Inactive'] ?? 0 },
    ],
    [t, counts.statusCounts]
  );
  const uuTienOptions = useMemo(() => {
    const base = getUuTienOptions(t);
    return base.map((o) => ({ ...o, count: counts.uuTienCounts[o.value] ?? 0 }));
  }, [t, counts.uuTienCounts]);

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
        key: 'uu_tien',
        label: t('thietLapCongViec.mau.form.uuTienMacDinh'),
        icon: ListOrdered,
        options: uuTienOptions,
        value: filters.uu_tien,
        onChange: (val: string[]) => setFilter('uu_tien', val),
      },
    ],
    [filters.status, filters.uu_tien, setFilter, statusOptions, uuTienOptions, t]
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
        options={uuTienOptions}
        value={filters.uu_tien}
        onChange={(val) => setFilter('uu_tien', val)}
        placeholder={t('thietLapCongViec.mau.form.uuTienMacDinh')}
        icon={ListOrdered}
        className="w-full sm:w-[160px]"
      />
    </>
  );

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
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
      searchPlaceholder={t('thietLapCongViec.mau.searchPlaceholder')}
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

export default MauCongViecToolbar;
