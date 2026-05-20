import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, Calendar, Hash, ToggleLeft, Ruler, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useBaoCaoSoCheStore, type BaoCaoSoCheFilters } from '../store/useBaoCaoSoCheStore';
import type { FarmBaoCaoSoChe } from '../core/types';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';

interface Props {
  data: FarmBaoCaoSoChe[];
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

function ngayToThang(ngay: string): string {
  return ngay.slice(0, 7);
}

const BaoCaoSoCheToolbar: React.FC<Props> = ({
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
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useBaoCaoSoCheStore);
  const filters = useBaoCaoSoCheStore((s) => s.filters);
  const setFilter = useBaoCaoSoCheStore((s) => s.setFilter);
  const clearSelection = useBaoCaoSoCheStore((s) => s.clearSelection);
  const columns = useBaoCaoSoCheStore((s) => s.columns);
  const toggleColumn = useBaoCaoSoCheStore((s) => s.toggleColumn);
  const reorderColumns = useBaoCaoSoCheStore((s) => s.reorderColumns);
  const resetColumns = useBaoCaoSoCheStore((s) => s.resetColumns);

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

  const trangThaiOptions = useMemo(
    () => [
      { value: 'mo', label: t('baoCaoSoChe.trangThai.mo'), count: data.filter((d) => d.trang_thai === 'mo').length },
      { value: 'khoa', label: t('baoCaoSoChe.trangThai.khoa'), count: data.filter((d) => d.trang_thai === 'khoa').length },
    ],
    [data, t]
  );

  const donViTinhOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => { if (r.don_vi_tinh) set.add(r.don_vi_tinh); });
    return [...set].sort().map((dvt) => ({
      value: dvt,
      label: dvt,
      count: data.filter((d) => d.don_vi_tinh === dvt).length,
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
    const f = filters as BaoCaoSoCheFilters;
    return (
      (searchInput.trim() ? 1 : 0) +
      (f.id_chi_nhanh?.length ?? 0) +
      (f.nam?.length ?? 0) +
      (f.thang?.length ?? 0) +
      (f.trang_thai?.length ?? 0) +
      (f.don_vi_tinh?.length ?? 0)
    );
  }, [searchInput, filters]);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('id_chi_nhanh', []);
    setFilter('nam', []);
    setFilter('thang', []);
    setFilter('trang_thai', []);
    setFilter('don_vi_tinh', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'nam',
        label: t('baoCaoSoChe.toolbar.filterNam'),
        icon: Calendar,
        options: namOptions,
        value: filters.nam ?? [],
        onChange: (v: string[]) => setFilter('nam', v),
      },
      {
        key: 'thang',
        label: t('baoCaoSoChe.toolbar.filterThang'),
        icon: Hash,
        options: thangOptions,
        value: filters.thang ?? [],
        onChange: (v: string[]) => setFilter('thang', v),
      },
      {
        key: 'trang_thai',
        label: t('baoCaoSoChe.toolbar.filterTrangThai'),
        icon: ToggleLeft,
        options: trangThaiOptions,
        value: filters.trang_thai ?? [],
        onChange: (v: string[]) => setFilter('trang_thai', v),
      },
      {
        key: 'don_vi_tinh',
        label: t('baoCaoSoChe.toolbar.filterDvt'),
        icon: Ruler,
        options: donViTinhOptions,
        value: filters.don_vi_tinh ?? [],
        onChange: (v: string[]) => setFilter('don_vi_tinh', v),
      },
      {
        key: 'branch',
        label: t('baoCaoSoChe.toolbar.filterBranch'),
        icon: Building2,
        options: branchOptions,
        value: filters.id_chi_nhanh ?? [],
        onChange: (v: string[]) => setFilter('id_chi_nhanh', v),
      },
    ],
    [t, namOptions, thangOptions, trangThaiOptions, donViTinhOptions, branchOptions, filters.nam, filters.thang, filters.trang_thai, filters.don_vi_tinh, filters.id_chi_nhanh, setFilter]
  );

  const renderFilters = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <FilterChipMultiSelect
        options={namOptions}
        value={filters.nam ?? []}
        onChange={(v) => setFilter('nam', v)}
        placeholder={t('baoCaoSoChe.toolbar.filterNam')}
        icon={Calendar}
        className="w-full sm:w-[120px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={thangOptions}
        value={filters.thang ?? []}
        onChange={(v) => setFilter('thang', v)}
        placeholder={t('baoCaoSoChe.toolbar.filterThang')}
        icon={Hash}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trang_thai ?? []}
        onChange={(v) => setFilter('trang_thai', v)}
        placeholder={t('baoCaoSoChe.toolbar.filterTrangThai')}
        icon={ToggleLeft}
        className="w-full sm:w-[150px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={donViTinhOptions}
        value={filters.don_vi_tinh ?? []}
        onChange={(v) => setFilter('don_vi_tinh', v)}
        placeholder={t('baoCaoSoChe.toolbar.filterDvt')}
        icon={Ruler}
        className="w-full sm:w-[140px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.id_chi_nhanh ?? []}
        onChange={(v) => setFilter('id_chi_nhanh', v)}
        placeholder={t('baoCaoSoChe.toolbar.filterBranch')}
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
          <span className="hidden sm:inline">{t('baoCaoSoChe.toolbar.add')}</span>
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
      searchPlaceholder={t('baoCaoSoChe.toolbar.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default BaoCaoSoCheToolbar;
