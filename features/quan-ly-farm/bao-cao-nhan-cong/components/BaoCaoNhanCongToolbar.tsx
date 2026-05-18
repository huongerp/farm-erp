import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, Calendar, Hash, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useBaoCaoNhanCongStore, type BaoCaoNhanCongFilters } from '../store/useBaoCaoNhanCongStore';
import type { FarmBaoCaoNhanCong } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';

interface Props {
  data: FarmBaoCaoNhanCong[];
  branches: Branch[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

function ngayToYear(ngay: string): string {
  return ngay.slice(0, 4);
}

/** yyyy-mm */
function ngayToThang(ngay: string): string {
  return ngay.slice(0, 7);
}

const BaoCaoNhanCongToolbar: React.FC<Props> = ({
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
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useBaoCaoNhanCongStore);
  const filters = useBaoCaoNhanCongStore((s) => s.filters);
  const setFilter = useBaoCaoNhanCongStore((s) => s.setFilter);
  const clearSelection = useBaoCaoNhanCongStore((s) => s.clearSelection);
  const columns = useBaoCaoNhanCongStore((s) => s.columns);
  const toggleColumn = useBaoCaoNhanCongStore((s) => s.toggleColumn);
  const reorderColumns = useBaoCaoNhanCongStore((s) => s.reorderColumns);
  const resetColumns = useBaoCaoNhanCongStore((s) => s.resetColumns);

  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}`,
        count: data.filter((d) => d.id_chi_nhanh === b.id).length,
      })),
    [branches, data]
  );

  const namOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.ngay && r.ngay.length >= 4) set.add(ngayToYear(r.ngay));
    });
    return [...set]
      .sort((a, b) => b.localeCompare(a))
      .map((y) => ({
        value: y,
        label: y,
        count: data.filter((d) => ngayToYear(d.ngay) === y).length,
      }));
  }, [data]);

  const thangOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.ngay && r.ngay.length >= 7) set.add(ngayToThang(r.ngay));
    });
    return [...set]
      .sort((a, b) => b.localeCompare(a))
      .map((ym) => {
        const [y, m] = ym.split('-');
        return {
          value: ym,
          label: `${m}/${y}`,
          count: data.filter((d) => ngayToThang(d.ngay) === ym).length,
        };
      });
  }, [data]);

  const activeFilterCount = useMemo(() => {
    const f = filters as BaoCaoNhanCongFilters;
    return (
      (searchInput.trim() ? 1 : 0) +
      (f.id_chi_nhanh?.length ?? 0) +
      (f.nam?.length ?? 0) +
      (f.thang?.length ?? 0)
    );
  }, [searchInput, filters]);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('id_chi_nhanh', []);
    setFilter('nam', []);
    setFilter('thang', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'nam',
        label: t('baoCaoNhanCong.toolbar.filterNam'),
        icon: Calendar,
        options: namOptions,
        value: filters.nam ?? [],
        onChange: (v: string[]) => setFilter('nam', v),
      },
      {
        key: 'thang',
        label: t('baoCaoNhanCong.toolbar.filterThang'),
        icon: Hash,
        options: thangOptions,
        value: filters.thang ?? [],
        onChange: (v: string[]) => setFilter('thang', v),
      },
      {
        key: 'branch',
        label: t('baoCaoNhanCong.toolbar.filterBranch'),
        icon: Building2,
        options: branchOptions,
        value: filters.id_chi_nhanh ?? [],
        onChange: (v: string[]) => setFilter('id_chi_nhanh', v),
      },
    ],
    [t, namOptions, thangOptions, branchOptions, filters.nam, filters.thang, filters.id_chi_nhanh, setFilter]
  );

  const renderFilters = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <FilterChipMultiSelect
        options={namOptions}
        value={filters.nam ?? []}
        onChange={(v) => setFilter('nam', v)}
        placeholder={t('baoCaoNhanCong.toolbar.filterNam')}
        icon={Calendar}
        className="w-full sm:w-[120px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={thangOptions}
        value={filters.thang ?? []}
        onChange={(v) => setFilter('thang', v)}
        placeholder={t('baoCaoNhanCong.toolbar.filterThang')}
        icon={Hash}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.id_chi_nhanh ?? []}
        onChange={(v) => setFilter('id_chi_nhanh', v)}
        placeholder={t('baoCaoNhanCong.toolbar.filterBranch')}
        icon={Building2}
        className="w-full sm:w-[200px]"
        size="md"
      />
    </div>
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
          <span className="hidden sm:inline">{t('baoCaoNhanCong.toolbar.add')}</span>
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
      searchPlaceholder={t('baoCaoNhanCong.toolbar.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default BaoCaoNhanCongToolbar;
