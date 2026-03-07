import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pin, FileText, Building2, Tag, List } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useTaiLieuStore } from '../store/useTaiLieuStore';
import { useLoaiTaiLieuList } from '../../thiet-lap-tai-lieu/hooks/use-loai-tai-lieu';
import { useTrangThaiTaiLieuList } from '../../thiet-lap-tai-lieu/hooks/use-trang-thai-tai-lieu';
import { useTaiLieuFilterCounts } from '../hooks/use-tai-lieu-filter-counts';
import { PHONG_BAN_NAMES } from '../../../../mocks/hanh-chinh';
import { HUONG_OPTIONS } from '../core/constants';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import { BTN_ADD } from '../../../../lib/button-labels';
import type { TaiLieu } from '../core/types';

interface Props {
  /** Danh sách tài liệu người dùng được xem. Count filter chip đếm trên list này. */
  items?: TaiLieu[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  pinnedOnly: boolean;
  onPinnedOnlyChange: (v: boolean) => void;
  pinnedCount: number;
  filterGroups?: FilterGroup[];
  onClearAllFilters?: () => void;
}

const TaiLieuToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
  pinnedOnly,
  onPinnedOnlyChange,
  pinnedCount,
  filterGroups,
  onClearAllFilters,
}) => {
  const { t } = useTranslation();
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
  } = useTaiLieuStore();

  const { data: loaiList = [] } = useLoaiTaiLieuList();
  const { data: trangThaiList = [] } = useTrangThaiTaiLieuList();
  const { huongCounts, phongBanCounts, loaiCounts, trangThaiCounts } = useTaiLieuFilterCounts(items, filters);

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    (filters.huong ? 1 : 0) +
    (filters.id_phong_ban ? 1 : 0) +
    (filters.id_loai?.length ?? 0) +
    (filters.id_trang_thai ? 1 : 0) +
    (pinnedOnly ? 1 : 0);

  const handleClearAllFilters = () => {
    setFilter('huong', '');
    setFilter('id_phong_ban', '');
    setFilter('id_loai', []);
    setFilter('id_trang_thai', '');
    onPinnedOnlyChange(false);
    onClearAllFilters?.();
  };

  const huongOptions = useMemo(
    () => HUONG_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value, count: huongCounts[o.value] ?? 0 })),
    [t, huongCounts]
  );
  const phongBanOptions = useMemo(
    () => Object.entries(PHONG_BAN_NAMES).map(([value, label]) => ({ label, value, count: phongBanCounts[value] ?? 0 })),
    [phongBanCounts]
  );
  const loaiOptions = useMemo(
    () => loaiList.map((l) => ({ label: l.ten, value: l.id, count: loaiCounts[l.id] ?? 0 })),
    [loaiList, loaiCounts]
  );
  const trangThaiOptions = useMemo(
    () => trangThaiList.map((tt) => ({ label: tt.ten, value: tt.id, count: trangThaiCounts[tt.id] ?? 0 })),
    [trangThaiList, trangThaiCounts]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={huongOptions}
        value={filters.huong ? [filters.huong] : []}
        onChange={(val) => setFilter('huong', val[0] ?? '')}
        placeholder={t('taiLieu.store.huongCol')}
        icon={FileText}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={phongBanOptions}
        value={filters.id_phong_ban ? [filters.id_phong_ban] : []}
        onChange={(val) => setFilter('id_phong_ban', val[0] ?? '')}
        placeholder={t('taiLieu.store.phongQuanLyCol')}
        icon={Building2}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.id_loai ?? []}
        onChange={(val) => setFilter('id_loai', val)}
        placeholder={t('taiLieu.store.loaiCol')}
        icon={List}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.id_trang_thai ? [filters.id_trang_thai] : []}
        onChange={(val) => setFilter('id_trang_thai', val[0] ?? '')}
        placeholder={t('taiLieu.store.trangThaiCol')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {pinnedCount > 0 && (
        <button
          type="button"
          onClick={() => onPinnedOnlyChange(!pinnedOnly)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            pinnedOnly
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Pin size={14} />
          {t('taiLieu.pinnedOnly')}
        </button>
      )}
      <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3">
        <Plus className="w-4 h-4 mr-1.5" />
        <span className="text-xs">{BTN_ADD()}</span>
      </Button>
    </div>
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
      searchPlaceholder={t('taiLieu.searchPlaceholder')}
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

export default TaiLieuToolbar;
