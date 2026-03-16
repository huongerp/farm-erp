import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Package, MapPin, User, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useCapPhatThuHoiStore } from '../store/useCapPhatThuHoiStore';
import { useAssetStorageLocations } from '../../thiet-lap-tai-san/hooks/use-noi-luu';
import { useEmployees } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { LOAI_PHIEU_OPTIONS } from '../core/constants';
import { useCapPhatThuHoiFilterCounts } from '../hooks/use-cap-phat-thu-hoi-filter-counts';
import type { LoaiPhieu } from '../core/types';
import type { PhieuCapPhatThuHoi } from '../core/types';
import type { ActionItem } from '../../../../components/ui/MobileActionsSheet';

interface Props {
  /** Danh sách phiếu người dùng được xem (sau phân quyền). Count filter chip đếm trên list này. */
  items?: PhieuCapPhatThuHoi[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  showAdd?: boolean;
  canDelete?: boolean;
}

const CapPhatThuHoiToolbar: React.FC<Props> = ({
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
  } = useCapPhatThuHoiStore();
  const { data: locations = [] } = useAssetStorageLocations();
  const { data: employees = [] } = useEmployees();
  const { loaiCounts, noiLuuCounts, nguoiThucHienCounts } = useCapPhatThuHoiFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const loaiOptions = useMemo(
    () =>
      LOAI_PHIEU_OPTIONS.map((o) => ({
        label: t(o.labelKey),
        value: o.value,
        count: loaiCounts[o.value] ?? 0,
      })),
    [t, loaiCounts]
  );
  const noiLuuOptions = useMemo(
    () =>
      locations.map((l) => ({
        label: l.ten_noi_luu,
        value: l.id,
        subLabel: l.ma_noi_luu,
        count: noiLuuCounts[l.id] ?? 0,
      })),
    [locations, noiLuuCounts]
  );
  const nguoiThucHienOptions = useMemo(
    () =>
      employees.map((e) => ({
        label: e.ho_ten,
        value: e.id,
        subLabel: e.ma_nhan_vien,
        count: nguoiThucHienCounts[e.id] ?? 0,
      })),
    [employees, nguoiThucHienCounts]
  );
  const activeFilterCount =
    filters.loai_phieu.length +
    filters.id_noi_luu_truoc.length +
    filters.id_nguoi_thuc_hien.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);
  const handleClearAllFilters = () => resetFilters();

  const renderFilters = (
    <>
      <FilterChipMultiSelect<LoaiPhieu>
        options={loaiOptions}
        value={filters.loai_phieu}
        onChange={(v) => setFilter('loai_phieu', v)}
        placeholder={t('capPhatThuHoi.store.loaiCol')}
        icon={Package}
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
          placeholder={t('capPhatThuHoi.filter.dateFrom')}
        />
      </div>
      <div className="relative w-full sm:w-[140px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          placeholder={t('capPhatThuHoi.filter.dateTo')}
        />
      </div>
      <FilterChipMultiSelect
        options={noiLuuOptions}
        value={filters.id_noi_luu_truoc}
        onChange={(v) => setFilter('id_noi_luu_truoc', v)}
        placeholder={t('capPhatThuHoi.store.noiLuuTruocCol')}
        icon={MapPin}
        className="w-full sm:w-[160px]"
        size="md"
      />
      <FilterChipMultiSelect
        options={nguoiThucHienOptions}
        value={filters.id_nguoi_thuc_hien}
        onChange={(v) => setFilter('id_nguoi_thuc_hien', v)}
        placeholder={t('capPhatThuHoi.store.nguoiThucHienCol')}
        icon={User}
        className="w-full sm:w-[180px]"
        size="md"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      { key: 'loai_phieu', label: t('capPhatThuHoi.store.loaiCol'), icon: Package, options: loaiOptions, value: filters.loai_phieu, onChange: (val: string[]) => setFilter('loai_phieu', val) },
      { key: 'id_noi_luu_truoc', label: t('capPhatThuHoi.store.noiLuuTruocCol'), icon: MapPin, options: noiLuuOptions, value: filters.id_noi_luu_truoc, onChange: (val: string[]) => setFilter('id_noi_luu_truoc', val) },
      { key: 'id_nguoi_thuc_hien', label: t('capPhatThuHoi.store.nguoiThucHienCol'), icon: User, options: nguoiThucHienOptions, value: filters.id_nguoi_thuc_hien, onChange: (val: string[]) => setFilter('id_nguoi_thuc_hien', val) },
    ],
    [loaiOptions, noiLuuOptions, nguoiThucHienOptions, filters.loai_phieu, filters.id_noi_luu_truoc, filters.id_nguoi_thuc_hien, setFilter, t]
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
          <span className="hidden sm:inline">{t('common.addNew')}</span>
        </Button>
      )}
    </div>
  );

  const mobileActions: ActionItem[] = useMemo(
    () => [{ label: t('common.addNew'), icon: Plus, onClick: onAdd }],
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
      searchPlaceholder={t('capPhatThuHoi.searchPlaceholder')}
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

export default CapPhatThuHoiToolbar;
