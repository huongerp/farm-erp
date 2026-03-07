import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDeXuatChiPhiStore } from '../store/useDeXuatChiPhiStore';
import type { DeXuatChiPhi } from '../core/types';

interface Props {
  data: DeXuatChiPhi[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
}

const DeXuatChiPhiToolbar: React.FC<Props> = ({
  data,
  selectedCount,
  onAdd,
  onDeleteMany,
}) => {
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearSelection,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useDeXuatChiPhiStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.status.length > 0 ? 1 : 0) +
      (filters.loai ? 1 : 0),
    [searchTerm, filters.status.length, filters.loai]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('loai', '');
  };

  const statusOptions = useMemo(
    () => [
      {
        label: t('deXuatChiPhi.status.pending'),
        value: '0',
        count: data.filter((d) => d.trang_thai === 0).length,
      },
      {
        label: t('deXuatChiPhi.status.approved'),
        value: '1',
        count: data.filter((d) => d.trang_thai === 1).length,
      },
      {
        label: t('deXuatChiPhi.status.rejected'),
        value: '2',
        count: data.filter((d) => d.trang_thai === 2).length,
      },
    ],
    [data, t]
  );

  const loaiOptions = useMemo(
    () => [
      {
        label: t('deXuatChiPhi.loaiThu'),
        value: 'thu',
        count: data.filter((d) => d.loai === 'thu').length,
      },
      {
        label: t('deXuatChiPhi.loaiChi'),
        value: 'chi',
        count: data.filter((d) => d.loai === 'chi').length,
      },
    ],
    [data, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('deXuatChiPhi.filterStatus')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.loai ? [filters.loai] : []}
        onChange={(v) => setFilter('loai', v[0] ?? '')}
        placeholder={t('deXuatChiPhi.filterLoai')}
        icon={ArrowDownCircle}
        className="w-full sm:w-[120px]"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('deXuatChiPhi.filterStatus'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'loai',
        label: t('deXuatChiPhi.filterLoai'),
        icon: ArrowUpCircle,
        options: loaiOptions,
        value: filters.loai ? [filters.loai] : [],
        onChange: (val: string[]) => setFilter('loai', (val[0] as '' | 'thu' | 'chi') ?? ''),
      },
    ],
    [filters.status, filters.loai, setFilter, t, statusOptions, loaiOptions]
  );

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('deXuatChiPhi.addItem')}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={onDeleteMany}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      showBack
      searchPlaceholder={t('deXuatChiPhi.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default DeXuatChiPhiToolbar;
