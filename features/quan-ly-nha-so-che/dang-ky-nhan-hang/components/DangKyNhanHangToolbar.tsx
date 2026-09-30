import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calendar, CalendarDays, CircleDot, Download, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { TRANG_THAI_DKNH } from '../core/types';
import type { DkNhTomTat } from '../services/dang-ky-nhan-hang-service';
import { useDangKyNhanHangStore } from '../store/useDangKyNhanHangStore';

interface Props {
  /** TÓM TẮT toàn bộ phiếu — chip lọc đếm trên toàn bộ dữ liệu, không phải trang đang xem. */
  data: DkNhTomTat[];
  branches: Branch[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const DangKyNhanHangToolbar: React.FC<Props> = ({
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
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useDangKyNhanHangStore);
  const filters = useDangKyNhanHangStore((s) => s.filters);
  const setFilter = useDangKyNhanHangStore((s) => s.setFilter);
  const clearSelection = useDangKyNhanHangStore((s) => s.clearSelection);
  const columns = useDangKyNhanHangStore((s) => s.columns);
  const toggleColumn = useDangKyNhanHangStore((s) => s.toggleColumn);
  const reorderColumns = useDangKyNhanHangStore((s) => s.reorderColumns);
  const resetColumns = useDangKyNhanHangStore((s) => s.resetColumns);
  const resetColumnWidths = useDangKyNhanHangStore((s) => s.resetColumnWidths);

  const dem = <K extends string>(keyOf: (r: DkNhTomTat) => K) => {
    const m = new Map<K, number>();
    data.forEach((r) => {
      const k = keyOf(r);
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return m;
  };

  const namOptions = useMemo(() => {
    const m = dem((r) => r.ngay_dang_ky.slice(0, 4));
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([v, count]) => ({ value: v, label: v, count }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const thangOptions = useMemo(() => {
    const m = dem((r) => r.ngay_dang_ky.slice(0, 7));
    return [...m.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([v, count]) => {
        const [y, mo] = v.split('-');
        return { value: v, label: `${mo}/${y}`, count };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const trangThaiOptions = useMemo(() => {
    const m = dem((r) => r.trang_thai);
    return TRANG_THAI_DKNH.map((v) => ({ value: v, label: t(`dangKyNhanHang.trangThai.${v}`), count: m.get(v) ?? 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, t]);

  const branchOptions = useMemo(() => {
    const m = dem((r) => r.id_chi_nhanh ?? '');
    return branches
      .filter((b) => m.has(b.id))
      .map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh, count: m.get(b.id) ?? 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, data]);

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    (filters.nam?.length ?? 0) +
    (filters.thang?.length ?? 0) +
    (filters.trang_thai?.length ?? 0) +
    (filters.id_chi_nhanh?.length ?? 0);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('nam', []);
    setFilter('thang', []);
    setFilter('trang_thai', []);
    setFilter('id_chi_nhanh', []);
  };

  const groups = [
    { key: 'trang_thai', label: t('dangKyNhanHang.col.trangThai'), icon: CircleDot, options: trangThaiOptions, width: 'sm:w-[150px]' },
    { key: 'nam', label: t('dangKyNhanHang.toolbar.filterNam'), icon: Calendar, options: namOptions, width: 'sm:w-[110px]' },
    { key: 'thang', label: t('dangKyNhanHang.toolbar.filterThang'), icon: CalendarDays, options: thangOptions, width: 'sm:w-[130px]' },
    { key: 'id_chi_nhanh', label: t('dangKyNhanHang.col.chiNhanh'), icon: Building2, options: branchOptions, width: 'sm:w-[170px]' },
  ] as const;

  const filterGroups = groups.map((g) => ({
    key: g.key,
    label: g.label,
    icon: g.icon,
    options: g.options,
    value: filters[g.key] ?? [],
    onChange: (v: string[]) => setFilter(g.key, v),
  }));

  const renderFilters = (
    <>
      {groups.map((g) => (
        <FilterChipMultiSelect
          key={g.key}
          options={g.options}
          value={filters[g.key] ?? []}
          onChange={(v) => setFilter(g.key, v)}
          placeholder={g.label}
          icon={g.icon}
          className={`w-full ${g.width}`}
          size="md"
        />
      ))}
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
            className="inline-flex h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
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
      mobileActions={[{ key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' }]}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
    />
  );
};

export default DangKyNhanHangToolbar;
