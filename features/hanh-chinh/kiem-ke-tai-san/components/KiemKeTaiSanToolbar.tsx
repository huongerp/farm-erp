import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import { MobileFilterField } from '../../../../components/ui/MobileFilterSheet';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useKiemKeTaiSanStore } from '../store/useKiemKeTaiSanStore';
import { useEmployeesRefQuery } from '@/lib/hooks/use-ref-queries';
import { TRANG_THAI_DOT_OPTIONS } from '../core/constants';
import { useKiemKeFilterCounts } from '../hooks/use-kiem-ke-filter-counts';
import type { DotKiemKe } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';

interface Props {
  items?: DotKiemKe[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  showAdd?: boolean;
  canDelete?: boolean;
}

const KiemKeTaiSanToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
  showAdd = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useKiemKeTaiSanStore);
  const filters = useKiemKeTaiSanStore((s) => s.filters);
  const setFilter = useKiemKeTaiSanStore((s) => s.setFilter);
  const resetFilters = useKiemKeTaiSanStore((s) => s.resetFilters);
  const columns = useKiemKeTaiSanStore((s) => s.columns);
  const toggleColumn = useKiemKeTaiSanStore((s) => s.toggleColumn);
  const reorderColumns = useKiemKeTaiSanStore((s) => s.reorderColumns);
  const resetColumns = useKiemKeTaiSanStore((s) => s.resetColumns);
  const resetColumnWidths = useKiemKeTaiSanStore((s) => s.resetColumnWidths);
  const selectedIds = useKiemKeTaiSanStore((s) => s.selectedIds);
  const clearSelection = useKiemKeTaiSanStore((s) => s.clearSelection);
  const { data: employees = [] } = useEmployeesRefQuery();
  const { trangThaiCounts, nguoiPhuTrachCounts } = useKiemKeFilterCounts(items);

  const selectedCount = selectedIds.size;
  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_DOT_OPTIONS.map((o) => ({
        label: o.label,
        value: o.value as string,
        count: trangThaiCounts[o.value] ?? 0,
      })),
    [trangThaiCounts]
  );
  const nguoiPhuTrachOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiPhuTrachCounts[e.id] ?? 0,
      })),
    [employees, nguoiPhuTrachCounts]
  );
  const activeFilterCount =
    filters.trang_thai_dot.length +
    filters.id_nguoi_phu_trach.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
  const handleClearAllFilters = () => resetFilters();

  const filterGroups = useMemo(
    () => [
      { key: 'trang_thai_dot', label: t('kiemKeTaiSan.store.trangThaiCol'), icon: Calendar, options: trangThaiOptions, value: filters.trang_thai_dot, onChange: (val: string[]) => setFilter('trang_thai_dot', val) },
      { key: 'id_nguoi_phu_trach', label: t('kiemKeTaiSan.store.nguoiPhuTrachCol'), icon: User, options: nguoiPhuTrachOptions, value: filters.id_nguoi_phu_trach, onChange: (val: string[]) => setFilter('id_nguoi_phu_trach', val) },
    ],
    [trangThaiOptions, nguoiPhuTrachOptions, filters.trang_thai_dot, filters.id_nguoi_phu_trach, setFilter, t]
  );

  const filterItems: FilterChipItem[] = [
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[160px]' },
    {
      kind: 'custom',
      key: 'dateFrom',
      node: (
        <div className="relative w-full sm:w-[140px]">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            placeholder={t('kiemKeTaiSan.filter.dateFrom')}
          />
        </div>
      ),
    },
    {
      kind: 'custom',
      key: 'dateTo',
      node: (
        <div className="relative w-full sm:w-[140px]">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            placeholder={t('kiemKeTaiSan.filter.dateTo')}
          />
        </div>
      ),
    },
    { kind: 'group', group: filterGroups[1], className: 'w-full sm:w-[180px]' },
  ];

  // Điện thoại ẩn hàng chip → hai ô Từ ngày / Đến ngày hiện trong bảng lọc mobile.
  const mobileFilterExtra = (
    <MobileFilterField
      label={`${t('kiemKeTaiSan.filter.dateFrom')} – ${t('kiemKeTaiSan.filter.dateTo')}`}
      icon={Calendar}
      active={!!(filters.dateFrom || filters.dateTo)}
    >
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="w-full h-10 rounded-lg border border-border bg-background px-2 text-sm"
          placeholder={t('kiemKeTaiSan.filter.dateFrom')}
          aria-label={t('kiemKeTaiSan.filter.dateFrom')}
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="w-full h-10 rounded-lg border border-border bg-background px-2 text-sm"
          placeholder={t('kiemKeTaiSan.filter.dateTo')}
          aria-label={t('kiemKeTaiSan.filter.dateTo')}
        />
      </div>
    </MobileFilterField>
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
          <span className="hidden sm:inline">{t('kiemKeTaiSan.addDot')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [{ label: t('kiemKeTaiSan.addDot'), icon: Plus, onClick: onAdd }],
    [t, onAdd]
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={<ResponsiveFilterChips items={filterItems} />}
      filterGroups={filterGroups}
      mobileFilterExtra={mobileFilterExtra}
      mobileFilterExtraCount={(filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0)}
      onAdd={onAdd}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete && selectedCount > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
      mobileActions={mobileActions}
    />
  );
};

export default KiemKeTaiSanToolbar;
