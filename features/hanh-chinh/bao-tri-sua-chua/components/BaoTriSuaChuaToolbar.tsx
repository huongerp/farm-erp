import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wrench, Calendar, Package } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useBaoTriSuaChuaStore } from '../store/useBaoTriSuaChuaStore';
import { useTaiSanList } from '../../danh-muc-tai-san/hooks/use-danh-muc-tai-san';
import { HANG_MUC_OPTIONS } from '../core/constants';
import { useBaoTriSuaChuaFilterCounts } from '../hooks/use-bao-tri-sua-chua-filter-counts';
import type { HangMuc } from '../core/types';
import type { PhieuBaoTriSuaChua } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';

interface Props {
  items?: PhieuBaoTriSuaChua[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  showAdd?: boolean;
  canDelete?: boolean;
}

const BaoTriSuaChuaToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
  showAdd = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    resetFilters,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    selectedIds,
    clearSelection,
  } = useBaoTriSuaChuaStore();
  const { data: assets = [] } = useTaiSanList();
  const { hangMucCounts, taiSanCounts } = useBaoTriSuaChuaFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const hangMucOptions = useMemo(
    () =>
      HANG_MUC_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value,
        count: hangMucCounts[o.value] ?? 0,
      })),
    [t, hangMucCounts]
  );
  const taiSanOptions = useMemo(
    () =>
      assets.map((a) => ({
        label: a.ten_tai_san ?? a.ma_tai_san,
        value: a.id,
        subLabel: a.ma_tai_san,
        count: taiSanCounts[a.id] ?? 0,
      })),
    [assets, taiSanCounts]
  );
  const activeFilterCount =
    filters.hang_muc.length +
    filters.id_tai_san.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
  const handleClearAllFilters = () => resetFilters();

  const renderFilters = (
    <>
      <FilterChipMultiSelect<HangMuc>
        options={hangMucOptions}
        value={filters.hang_muc}
        onChange={(v) => setFilter('hang_muc', v)}
        placeholder={t('baoTriSuaChua.store.hangMucCol')}
        icon={Wrench}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoTriSuaChua.filter.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('baoTriSuaChua.filter.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={taiSanOptions}
        value={filters.id_tai_san}
        onChange={(v) => setFilter('id_tai_san', v)}
        placeholder={t('baoTriSuaChua.store.taiSanCol')}
        icon={Package}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      { key: 'hang_muc', label: t('baoTriSuaChua.store.hangMucCol'), icon: Wrench, options: hangMucOptions, value: filters.hang_muc, onChange: (val: string[]) => setFilter('hang_muc', val) },
      { key: 'id_tai_san', label: t('baoTriSuaChua.store.taiSanCol'), icon: Package, options: taiSanOptions, value: filters.id_tai_san, onChange: (val: string[]) => setFilter('id_tai_san', val) },
    ],
    [hangMucOptions, taiSanOptions, filters.hang_muc, filters.id_tai_san, setFilter, t]
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
          <span className="hidden sm:inline">{t('baoTriSuaChua.form.addPhieu')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [{ label: t('baoTriSuaChua.form.addPhieu'), icon: Plus, onClick: onAdd }],
    [t, onAdd]
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
      searchPlaceholder={t('baoTriSuaChua.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && selectedCount > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
      mobileActions={mobileActions}
    />
  );
};

export default BaoTriSuaChuaToolbar;
