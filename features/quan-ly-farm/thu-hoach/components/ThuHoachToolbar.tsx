import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, Hash, Building2, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useThuHoachStore, type ThuHoachFilters } from '../store/useThuHoachStore';
import type { FarmThuHoach } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';

interface Props {
  data: FarmThuHoach[];
  branches: Branch[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const ThuHoachToolbar: React.FC<Props> = ({
  data,
  branches,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useThuHoachStore);
  const filters = useThuHoachStore((s) => s.filters);
  const setFilter = useThuHoachStore((s) => s.setFilter);
  const clearSelection = useThuHoachStore((s) => s.clearSelection);
  const columns = useThuHoachStore((s) => s.columns);
  const toggleColumn = useThuHoachStore((s) => s.toggleColumn);
  const reorderColumns = useThuHoachStore((s) => s.reorderColumns);
  const resetColumns = useThuHoachStore((s) => s.resetColumns);

  const namOptions = useMemo(() => {
    const set = new Set<number>();
    data.forEach((r) => set.add(r.nam));
    return [...set]
      .sort((a, b) => b - a)
      .map((n) => ({
        value: String(n),
        label: String(n),
        count: data.filter((d) => d.nam === n).length,
      }));
  }, [data]);

  const tuanOptions = useMemo(() => {
    const set = new Set<number>();
    data.forEach((r) => set.add(r.tuan));
    return [...set]
      .sort((a, b) => a - b)
      .map((w) => ({
        value: String(w),
        label: t('thuHoach.stats.colWeek') + ' ' + w,
        count: data.filter((d) => d.tuan === w).length,
      }));
  }, [data, t]);

  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: b.ten_chi_nhanh,
        subLabel: b.ma_chi_nhanh,
        count: data.filter((d) => d.id_chi_nhanh === b.id).length,
      })),
    [branches, data]
  );

  const activeFilterCount = useMemo(() => {
    const f = filters as ThuHoachFilters;
    return (
      (searchInput.trim() ? 1 : 0) +
      (f.nam?.length ?? 0) +
      (f.tuan?.length ?? 0) +
      (f.id_chi_nhanh?.length ?? 0)
    );
  }, [searchInput, filters]);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('nam', []);
    setFilter('tuan', []);
    setFilter('id_chi_nhanh', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'nam',
        label: t('thuHoach.toolbar.filterNam'),
        icon: Calendar,
        options: namOptions,
        value: filters.nam ?? [],
        onChange: (v: string[]) => setFilter('nam', v),
      },
      {
        key: 'tuan',
        label: t('thuHoach.toolbar.filterTuan'),
        icon: Hash,
        options: tuanOptions,
        value: filters.tuan ?? [],
        onChange: (v: string[]) => setFilter('tuan', v),
      },
      {
        key: 'branch',
        label: t('thuHoach.toolbar.filterBranch'),
        icon: Building2,
        options: branchOptions,
        value: filters.id_chi_nhanh ?? [],
        onChange: (v: string[]) => setFilter('id_chi_nhanh', v),
      },
    ],
    [t, namOptions, tuanOptions, branchOptions, filters.nam, filters.tuan, filters.id_chi_nhanh, setFilter]
  );

  const mobileActions = useMemo(
    () => [
      {
        key: 'export',
        label: t('common.export'),
        icon: Download,
        onClick: onExport,
        description: '',
      },
    ],
    [onExport, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={namOptions}
        value={filters.nam ?? []}
        onChange={(v) => setFilter('nam', v)}
        placeholder={t('thuHoach.toolbar.filterNam')}
        icon={Calendar}
        className="w-full sm:w-[120px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={tuanOptions}
        value={filters.tuan ?? []}
        onChange={(v) => setFilter('tuan', v)}
        placeholder={t('thuHoach.toolbar.filterTuan')}
        icon={Hash}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.id_chi_nhanh ?? []}
        onChange={(v) => setFilter('id_chi_nhanh', v)}
        placeholder={t('thuHoach.toolbar.filterBranch')}
        icon={Building2}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      {canCreate ? (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      ) : null}
    </>
  );

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
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('thuHoach.toolbar.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ThuHoachToolbar;
