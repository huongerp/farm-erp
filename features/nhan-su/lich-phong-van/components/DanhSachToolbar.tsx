import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, User, Video, CircleDot, Calendar, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { formatDate } from '../../../../lib/utils';
import { useLichPhongVanStore } from '../store/useLichPhongVanStore';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import { HINH_THUC_OPTIONS, TRANG_THAI_LICH_PV_KEYS } from '../core/constants';
import type { LichPhongVan } from '../core/types';

interface Props {
  items?: LichPhongVan[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const DanhSachToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany }) => {
  const { t } = useTranslation();
  const { data: ungVienList = [] } = useUngViens();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    selectedIds,
    clearSelection,
  } = useLichPhongVanStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    filters.id_ung_vien.length +
    filters.hinh_thuc.length +
    filters.trang_thai.length +
    (filters.ngay_tu ? 1 : 0) +
    (filters.ngay_den ? 1 : 0);

  const handleClearAllFilters = () => {
    setFilter('id_ung_vien', []);
    setFilter('ngay_tu', '');
    setFilter('ngay_den', '');
    setFilter('hinh_thuc', []);
    setFilter('trang_thai', []);
  };

  const ungVienOptions = useMemo(
    () =>
      ungVienList.map((u) => ({
        label: u.ho_ten,
        value: u.id,
        count: items.filter((i) => i.id_ung_vien === u.id).length,
      })),
    [ungVienList, items]
  );

  const hinhThucOptions = useMemo(
    () =>
      HINH_THUC_OPTIONS.map(({ value, labelKey }) => ({
        label: t(labelKey),
        value,
        count: items.filter((i) => i.hinh_thuc === value).length,
      })),
    [t, items]
  );

  const trangThaiOptions = useMemo(
    () =>
      [0, 1, 2, 3].map((value) => ({
        label: t(TRANG_THAI_LICH_PV_KEYS[value]),
        value: String(value),
        count: items.filter((i) => i.trang_thai === value).length,
      })),
    [t, items]
  );

  const hasDateRange = !!(filters.ngay_tu || filters.ngay_den);
  const dateRangeChipLabel = useMemo(() => {
    if (filters.ngay_tu && filters.ngay_den) {
      return t('lichPhongVan.filterDateRange', {
        from: formatDate(filters.ngay_tu),
        to: formatDate(filters.ngay_den),
      });
    }
    if (filters.ngay_tu) return t('lichPhongVan.filterFromDate', { date: formatDate(filters.ngay_tu) });
    if (filters.ngay_den) return t('lichPhongVan.filterToDate', { date: formatDate(filters.ngay_den) });
    return '';
  }, [filters.ngay_tu, filters.ngay_den, t]);

  const clearDateRange = () => {
    setFilter('ngay_tu', '');
    setFilter('ngay_den', '');
  };

  const renderFilters = (
    <>
      <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filters.ngay_tu}
            onChange={(e) => setFilter('ngay_tu', e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 min-w-0 max-w-[140px]"
            aria-label={t('lichPhongVan.filterNgay')}
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="date"
            value={filters.ngay_den}
            onChange={(e) => setFilter('ngay_den', e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 min-w-0 max-w-[140px]"
            aria-label={t('lichPhongVan.filterNgay')}
          />
        </div>
        {hasDateRange && (
          <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium shrink-0">
            <Calendar size={12} className="shrink-0" />
            <span className="truncate max-w-[180px]">{dateRangeChipLabel}</span>
            <button
              type="button"
              onClick={clearDateRange}
              className="p-0.5 rounded hover:bg-primary/20 transition-colors"
              aria-label={t('common.clearFilter')}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        )}
      </div>
      <FilterChipMultiSelect
        options={ungVienOptions}
        value={filters.id_ung_vien}
        onChange={(val) => setFilter('id_ung_vien', val)}
        placeholder={t('lichPhongVan.filterUngVien')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={hinhThucOptions}
        value={filters.hinh_thuc}
        onChange={(val) => setFilter('hinh_thuc', val)}
        placeholder={t('lichPhongVan.filterHinhThuc')}
        icon={Video}
        className="w-full sm:w-[120px]"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trang_thai.map(String)}
        onChange={(val) => setFilter('trang_thai', val.map(Number))}
        placeholder={t('lichPhongVan.filterTrangThai')}
        icon={CircleDot}
        className="w-full sm:w-[130px]"
      />
    </>
  );

  const renderActions = (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('lichPhongVan.add')}</span>
    </Button>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_ung_vien',
        label: t('lichPhongVan.filterUngVien'),
        icon: User,
        options: ungVienOptions,
        value: filters.id_ung_vien,
        onChange: (val: string[]) => setFilter('id_ung_vien', val),
      },
      {
        key: 'hinh_thuc',
        label: t('lichPhongVan.filterHinhThuc'),
        icon: Video,
        options: hinhThucOptions,
        value: filters.hinh_thuc,
        onChange: (val: string[]) => setFilter('hinh_thuc', val),
      },
      {
        key: 'trang_thai',
        label: t('lichPhongVan.filterTrangThai'),
        icon: CircleDot,
        options: trangThaiOptions,
        value: filters.trang_thai.map(String),
        onChange: (val: string[]) => setFilter('trang_thai', val.map(Number)),
      },
    ],
    [t, ungVienOptions, hinhThucOptions, trangThaiOptions, filters, setFilter]
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
      searchPlaceholder={t('lichPhongVan.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default DanhSachToolbar;
