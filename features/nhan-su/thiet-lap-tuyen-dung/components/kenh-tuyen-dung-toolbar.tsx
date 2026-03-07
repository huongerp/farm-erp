import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Megaphone } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useKenhTuyenDungStore } from '../store/useKenhTuyenDungStore';

interface Props {
  items?: { trang_thai: number }[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: 0 | 1) => void;
}

const KenhTuyenDungToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany }) => {
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
  } = useKenhTuyenDungStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length;
  const handleClearAllFilters = () => setFilter('status', []);

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: items.filter((i) => i.trang_thai === 1).length },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: items.filter((i) => i.trang_thai === 0).length },
    ],
    [t, items]
  );

  const renderFilters = (
    <FilterChipMultiSelect
      options={statusOptions}
      value={filters.status}
      onChange={(val) => setFilter('status', val)}
      placeholder={t('common.status')}
      icon={Megaphone}
      className="w-full sm:w-[140px]"
    />
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
      filterGroups={[{ key: 'status', label: t('common.status'), icon: Megaphone, options: statusOptions, value: filters.status, onChange: (val: string[]) => setFilter('status', val) }]}
      onAdd={onAdd}
      searchPlaceholder={t('thietLapTuyenDung.kenhTuyenDung.searchPlaceholder')}
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

export default KenhTuyenDungToolbar;
