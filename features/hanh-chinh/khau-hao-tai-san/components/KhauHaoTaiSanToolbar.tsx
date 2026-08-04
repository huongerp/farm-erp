import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useKhauHaoTaiSanStore } from '../store/useKhauHaoTaiSanStore';
import { TRANG_THAI_KY_OPTIONS } from '../core/constants';
import type { KyKhauHao } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';

interface Props {
  items?: KyKhauHao[];
  onAdd: () => void;
  onDeleteMany?: (ids: string[]) => void;
  showAdd?: boolean;
}

const KhauHaoTaiSanToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, showAdd = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useKhauHaoTaiSanStore);
  const filters = useKhauHaoTaiSanStore((s) => s.filters);
  const setFilter = useKhauHaoTaiSanStore((s) => s.setFilter);
  const resetFilters = useKhauHaoTaiSanStore((s) => s.resetFilters);
  const columns = useKhauHaoTaiSanStore((s) => s.columns);
  const toggleColumn = useKhauHaoTaiSanStore((s) => s.toggleColumn);
  const reorderColumns = useKhauHaoTaiSanStore((s) => s.reorderColumns);
  const resetColumns = useKhauHaoTaiSanStore((s) => s.resetColumns);
  const selectedIds = useKhauHaoTaiSanStore((s) => s.selectedIds);
  const clearSelection = useKhauHaoTaiSanStore((s) => s.clearSelection);

  const selectedCount = selectedIds.size;
  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_KY_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value as string,
        count: items.filter((i) => i.trang_thai === o.value).length,
      })),
    [t, items]
  );
  const namOptions = useMemo(() => {
    const years = new Set(items.map((i) => i.nam));
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => ({ label: String(y), value: String(y), count: items.filter((i) => i.nam === y).length }));
  }, [items]);
  const thangOptions = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({
        label: String(m),
        value: String(m),
        count: items.filter((i) => i.thang === m).length,
      })),
    [items]
  );
  const activeFilterCount =
    (filters.nam ? 1 : 0) + filters.thang.length + filters.trang_thai_ky.length + filters.id_nhom.length;
  const handleClearAllFilters = () => resetFilters();

  const renderFilters = (
    <>
      {namOptions.length > 0 && (
        <FilterChipMultiSelect
          options={namOptions}
          value={filters.nam ? [filters.nam] : []}
          onChange={(v) => setFilter('nam', v[0] ?? '')}
          placeholder={t('khauHaoTaiSan.store.namCol')}
          icon={Calendar}
          className="w-full sm:w-[100px]"
          size="md"
        />
      )}
      <FilterChipMultiSelect
        options={thangOptions}
        value={filters.thang}
        onChange={(v) => setFilter('thang', v)}
        placeholder={t('khauHaoTaiSan.store.thangCol')}
        icon={Calendar}
        className="w-full sm:w-[120px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trang_thai_ky}
        onChange={(v) => setFilter('trang_thai_ky', v)}
        placeholder={t('khauHaoTaiSan.store.trangThaiCol')}
        icon={Calendar}
        className="w-full sm:w-[140px]"
        size="md"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      { key: 'trang_thai_ky', label: t('khauHaoTaiSan.store.trangThaiCol'), icon: Calendar, options: trangThaiOptions, value: filters.trang_thai_ky, onChange: (val: string[]) => setFilter('trang_thai_ky', val) },
      { key: 'thang', label: t('khauHaoTaiSan.store.thangCol'), icon: Calendar, options: thangOptions, value: filters.thang, onChange: (val: string[]) => setFilter('thang', val) },
    ],
    [trangThaiOptions, thangOptions, filters.trang_thai_ky, filters.thang, setFilter, t]
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {showAdd && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('khauHaoTaiSan.addKy')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [{ label: t('khauHaoTaiSan.addKy'), icon: Plus, onClick: onAdd }],
    [t, onAdd]
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      searchPlaceholder={t('khauHaoTaiSan.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={onDeleteMany && selectedCount > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
      mobileActions={mobileActions}
    />
  );
};

export default KhauHaoTaiSanToolbar;
