import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Briefcase, Filter } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDeXuatTuyenDungStore } from '../store/useDeXuatTuyenDungStore';
import { usePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import type { DeXuatTuyenDung } from '../core/types';

interface Props {
  items?: DeXuatTuyenDung[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: 0 | 1 | 2 | 3) => void;
}

const STATUS_OPTIONS = [
  { value: 0, key: 'deXuatTuyenDung.status.nhap' },
  { value: 1, key: 'deXuatTuyenDung.status.choDuyet' },
  { value: 2, key: 'deXuatTuyenDung.status.daDuyet' },
  { value: 3, key: 'deXuatTuyenDung.status.tuChoi' },
];

const DanhSachToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany }) => {
  const { t } = useTranslation();
  const { data: positions = [] } = usePositions();
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
  } = useDeXuatTuyenDungStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length + filters.id_chuc_vu.length;
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('id_chuc_vu', []);
  };

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map(({ value, key }) => ({
        label: t(key),
        value: String(value),
        count: items.filter((i) => i.trang_thai === value).length,
      })),
    [t, items]
  );

  const chucVuOptions = useMemo(
    () =>
      positions
        .filter((p) => p.trang_thai === 1)
        .map((p) => ({
          label: p.ten_chuc_vu,
          value: p.id,
          count: items.filter((i) => i.id_chuc_vu === p.id).length,
        })),
    [positions, items]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status.map(String)}
        onChange={(val) => setFilter('status', val.map(Number))}
        placeholder={t('deXuatTuyenDung.filterStatus')}
        icon={Filter}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={chucVuOptions}
        value={filters.id_chuc_vu}
        onChange={(val) => setFilter('id_chuc_vu', val)}
        placeholder={t('deXuatTuyenDung.filterChucVu')}
        icon={Briefcase}
        className="w-full sm:w-[180px]"
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
      <span className="hidden sm:inline">{t('deXuatTuyenDung.add')}</span>
    </Button>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('deXuatTuyenDung.filterStatus'),
        icon: Filter,
        options: statusOptions,
        value: filters.status.map(String),
        onChange: (val: string[]) => setFilter('status', val.map(Number)),
      },
      {
        key: 'id_chuc_vu',
        label: t('deXuatTuyenDung.filterChucVu'),
        icon: Briefcase,
        options: chucVuOptions,
        value: filters.id_chuc_vu,
        onChange: (val: string[]) => setFilter('id_chuc_vu', val),
      },
    ],
    [t, statusOptions, chucVuOptions, filters, setFilter]
  );

  const bulkStatusDropdown = selectedCount > 0 && (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_OPTIONS.map(({ value, key }) => (
        <button
          key={value}
          onClick={() => onStatusChangeMany(Array.from(selectedIds), value)}
          className="px-2 py-1 text-xs rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-foreground"
        >
          {t(key)}
        </button>
      ))}
    </div>
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
      searchPlaceholder={t('deXuatTuyenDung.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      bulkActions={bulkStatusDropdown}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default DanhSachToolbar;
