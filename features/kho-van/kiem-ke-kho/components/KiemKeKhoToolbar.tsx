import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, Calendar, Warehouse } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useKiemKeKhoStore } from '../store/useKiemKeKhoStore';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { TRANG_THAI_DOT_OPTIONS } from '../core/constants';
import { useKiemKeKhoFilterCounts } from '../hooks/use-kiem-ke-kho-filter-counts';
import type { DotKiemKeKho } from '../core/types';
import type { TrangThaiDotKiemKeKho } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';

interface Props {
  items?: DotKiemKeKho[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  showAdd?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

const KiemKeKhoToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
  showAdd = true,
  canCreate = true,
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
  } = useKiemKeKhoStore();
  const { data: employees = [] } = useEmployees();
  const { data: khoList = [] } = useKhoList();
  const { trangThaiCounts, nguoiPhuTrachCounts, idKhoCounts } = useKiemKeKhoFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_DOT_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value as string,
        count: trangThaiCounts[o.value] ?? 0,
      })),
    [t, trangThaiCounts]
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
  const idKhoOptions = useMemo(
    () =>
      khoList
        .filter((k) => k.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((k) => ({
          label: k.ten_kho,
          value: k.id,
          subLabel: k.ma_kho,
          count: idKhoCounts[k.id] ?? 0,
        })),
    [khoList, idKhoCounts]
  );
  const activeFilterCount =
    filters.trang_thai_dot.length +
    filters.id_nguoi_phu_trach.length +
    filters.id_kho.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
  const handleClearAllFilters = () => resetFilters();

  const renderFilters = (
    <>
      <FilterChipMultiSelect<TrangThaiDotKiemKeKho>
        options={trangThaiOptions}
        value={filters.trang_thai_dot as TrangThaiDotKiemKeKho[]}
        onChange={(v) => setFilter('trang_thai_dot', v)}
        placeholder={t('kiemKeKho.store.trangThaiCol')}
        icon={Calendar}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={idKhoOptions}
        value={filters.id_kho}
        onChange={(v) => setFilter('id_kho', v)}
        placeholder={t('kiemKeKho.store.khoCol')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguoiPhuTrachOptions}
        value={filters.id_nguoi_phu_trach}
        onChange={(v) => setFilter('id_nguoi_phu_trach', v)}
        placeholder={t('kiemKeKho.store.nguoiPhuTrachCol')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('kiemKeKho.filter.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('kiemKeKho.filter.dateTo')}
        />
      </div>
    </>
  );

  const filterGroups = useMemo(
    () => [
      { key: 'trang_thai_dot', label: t('kiemKeKho.store.trangThaiCol'), icon: Calendar, options: trangThaiOptions, value: filters.trang_thai_dot, onChange: (val: string[]) => setFilter('trang_thai_dot', val) },
      { key: 'id_kho', label: t('kiemKeKho.store.khoCol'), icon: Warehouse, options: idKhoOptions, value: filters.id_kho, onChange: (val: string[]) => setFilter('id_kho', val) },
      { key: 'id_nguoi_phu_trach', label: t('kiemKeKho.store.nguoiPhuTrachCol'), icon: User, options: nguoiPhuTrachOptions, value: filters.id_nguoi_phu_trach, onChange: (val: string[]) => setFilter('id_nguoi_phu_trach', val) },
    ],
    [trangThaiOptions, idKhoOptions, nguoiPhuTrachOptions, filters.trang_thai_dot, filters.id_kho, filters.id_nguoi_phu_trach, setFilter, t]
  );

  const showAddButton = showAdd && canCreate;
  const renderActions = (
    <div className="flex items-center gap-2">
      {showAddButton && (
        <Button
          onClick={onAdd}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('kiemKeKho.addDot')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => (showAddButton ? [{ label: t('kiemKeKho.addDot'), icon: Plus, onClick: onAdd }] : []),
    [t, onAdd, showAddButton]
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
      onAdd={canCreate ? onAdd : undefined}
      searchPlaceholder={t('kiemKeKho.searchPlaceholder')}
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

export default KiemKeKhoToolbar;
