import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calendar, CalendarDays, Download, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { NkppTomTat } from '../services/nhat-ky-pha-phen-service';
import { useNhatKyPhaPhenStore } from '../store/useNhatKyPhaPhenStore';

interface Props {
  /** TÓM TẮT toàn bộ nhật ký — chip lọc đếm trên toàn bộ dữ liệu, không phải trang đang xem. */
  data: NkppTomTat[];
  branches: Branch[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const NhatKyPhaPhenToolbar: React.FC<Props> = ({
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
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useNhatKyPhaPhenStore);
  const filters = useNhatKyPhaPhenStore((s) => s.filters);
  const setFilter = useNhatKyPhaPhenStore((s) => s.setFilter);
  const clearSelection = useNhatKyPhaPhenStore((s) => s.clearSelection);
  const columns = useNhatKyPhaPhenStore((s) => s.columns);
  const toggleColumn = useNhatKyPhaPhenStore((s) => s.toggleColumn);
  const reorderColumns = useNhatKyPhaPhenStore((s) => s.reorderColumns);
  const resetColumns = useNhatKyPhaPhenStore((s) => s.resetColumns);
  const resetColumnWidths = useNhatKyPhaPhenStore((s) => s.resetColumnWidths);

  const options = useMemo(() => {
    const dem = (keys: (r: NkppTomTat) => string[]) => {
      const m = new Map<string, number>();
      data.forEach((r) => keys(r).forEach((k) => m.set(k, (m.get(k) ?? 0) + 1)));
      return m;
    };
    const nam = dem((r) => [r.ngay.slice(0, 4)]);
    const thang = dem((r) => [r.ngay.slice(0, 7)]);
    const cn = dem((r) => (r.id_chi_nhanh ? [r.id_chi_nhanh] : []));
    return {
      nam: [...nam.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([v, count]) => ({ value: v, label: v, count })),
      thang: [...thang.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([v, count]) => {
          const [y, mo] = v.split('-');
          return { value: v, label: `${mo}/${y}`, count };
        }),
      id_chi_nhanh: branches
        .filter((b) => cn.has(b.id))
        .map((b) => ({ value: b.id, label: b.ten_chi_nhanh, subLabel: b.ma_chi_nhanh, count: cn.get(b.id) ?? 0 })),
    };
  }, [data, branches]);

  const groups = [
    { key: 'thang', label: t('nkpp.toolbar.filterThang'), icon: CalendarDays, width: 'sm:w-[130px]' },
    { key: 'nam', label: t('nkpp.toolbar.filterNam'), icon: Calendar, width: 'sm:w-[110px]' },
    { key: 'id_chi_nhanh', label: t('nkpp.col.chiNhanh'), icon: Building2, width: 'sm:w-[170px]' },
  ] as const;

  const filterGroups = groups.map((g) => ({
    key: g.key,
    label: g.label,
    icon: g.icon,
    options: options[g.key],
    value: filters[g.key] ?? [],
    onChange: (v: string[]) => setFilter(g.key, v),
  }));

  const filterItems: FilterChipItem[] = filterGroups.map((g, i) => ({
    kind: 'group',
    group: g,
    className: `w-full ${groups[i].width}`,
  }));

  const activeFilterCount = (searchInput.trim() ? 1 : 0) + groups.reduce((s, g) => s + (filters[g.key]?.length ?? 0), 0);

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    groups.forEach((g) => setFilter(g.key, []));
  };

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
      filters={<ResponsiveFilterChips items={filterItems} />}
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

export default NhatKyPhaPhenToolbar;
