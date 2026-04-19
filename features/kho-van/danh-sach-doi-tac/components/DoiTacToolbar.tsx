import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Folder } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useDoiTacStore } from '../store/useDoiTacStore';
import type { DoiTac } from '../core/types';
import type { NhomDoiTac } from '../core/types';

interface Props {
  data: DoiTac[];
  nhomList: NhomDoiTac[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const DoiTacToolbar: React.FC<Props> = ({
  data,
  nhomList,
  selectedCount,
  onAdd,
  onDeleteMany,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useDoiTacStore);
  const filters = useDoiTacStore((s) => s.filters);
  const setFilter = useDoiTacStore((s) => s.setFilter);
  const clearSelection = useDoiTacStore((s) => s.clearSelection);
  const columns = useDoiTacStore((s) => s.columns);
  const toggleColumn = useDoiTacStore((s) => s.toggleColumn);
  const reorderColumns = useDoiTacStore((s) => s.reorderColumns);
  const resetColumns = useDoiTacStore((s) => s.resetColumns);

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) +
      (filters.status.length > 0 ? 1 : 0) +
      (filters.id_nhom.length > 0 ? 1 : 0),
    [searchInput, filters.status.length, filters.id_nhom.length]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('status', []);
    setFilter('id_nhom', []);
  };

  const statusOptions = useMemo(
    () => [
      {
        label: t('common.activeStatus'),
        value: 'Active',
        count: data.filter((d) => d.trang_thai === 'Đang hoạt động').length,
      },
      {
        label: t('common.inactiveStatus'),
        value: 'Inactive',
        count: data.filter((d) => d.trang_thai === 'Ngừng hoạt động').length,
      },
    ],
    [data, t]
  );

  const nhomOptions = useMemo(
    () =>
      nhomList.map((n) => ({
        label: n.ten_nhom,
        value: n.id,
        count: data.filter((d) => d.id_nhom === n.id).length,
      })),
    [nhomList, data]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={nhomOptions}
        value={filters.id_nhom}
        onChange={(v) => setFilter('id_nhom', v)}
        placeholder={t('doiTac.form.group')}
        icon={Folder}
        className="w-full sm:w-[160px]"
      />
    </>
  );

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
        key: 'id_nhom',
        label: t('doiTac.form.group'),
        icon: Folder,
        options: nhomOptions,
        value: filters.id_nhom,
        onChange: (val: string[]) => setFilter('id_nhom', val),
      },
    ],
    [filters.status, filters.id_nhom, setFilter, t, statusOptions, nhomOptions]
  );

  const renderActions = canCreate ? (
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
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('doiTac.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default DoiTacToolbar;
