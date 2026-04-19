import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, MapPin } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useNoiLuuStore } from '../store/useNoiLuuStore';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';

interface Props {
  /** Danh sách nơi lưu. Count filter chip đếm trên list này. */
  items?: { trang_thai: string; id_chi_nhanh?: string | null }[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const NoiLuuToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany, canCreate = true, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useNoiLuuStore);
  const filters = useNoiLuuStore((s) => s.filters);
  const setFilter = useNoiLuuStore((s) => s.setFilter);
  const columns = useNoiLuuStore((s) => s.columns);
  const toggleColumn = useNoiLuuStore((s) => s.toggleColumn);
  const reorderColumns = useNoiLuuStore((s) => s.reorderColumns);
  const resetColumns = useNoiLuuStore((s) => s.resetColumns);
  const selectedIds = useNoiLuuStore((s) => s.selectedIds);
  const clearSelection = useNoiLuuStore((s) => s.clearSelection);
  const { data: branches = [] } = useBranches();

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length + filters.id_chi_nhanh.length;
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('id_chi_nhanh', []);
  };

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: items.filter((i) => i.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).length },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: items.filter((i) => i.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG).length },
    ],
    [t, items]
  );
  const branchOptions = useMemo(() => {
    const countByBranch: Record<string, number> = {};
    for (const i of items) {
      if (i.id_chi_nhanh) {
        countByBranch[i.id_chi_nhanh] = (countByBranch[i.id_chi_nhanh] || 0) + 1;
      }
    }
    return branches.map((b) => ({
      label: b.ten_chi_nhanh,
      value: b.id,
      subLabel: b.ma_chi_nhanh,
      count: countByBranch[b.id] ?? 0,
    }));
  }, [branches, items]);

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'id_chi_nhanh',
        label: t('thietLapTaiSan.noiLuu.form.branch'),
        icon: MapPin,
        options: branchOptions,
        value: filters.id_chi_nhanh,
        onChange: (val: string[]) => setFilter('id_chi_nhanh', val),
      },
    ],
    [filters.status, filters.id_chi_nhanh, setFilter, statusOptions, branchOptions, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.id_chi_nhanh}
        onChange={(val) => setFilter('id_chi_nhanh', val)}
        placeholder={t('thietLapTaiSan.noiLuu.form.branch')}
        icon={MapPin}
        className="w-full sm:w-[200px]"
      />
    </>
  );

  const renderActions = canCreate ? (
    <Button
      onClick={onAdd}
      size="sm"
      className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
    >
      <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  ) : null;

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      searchPlaceholder={t('thietLapTaiSan.noiLuu.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      onStatusChangeMany={canUpdate ? (numStatus) => onStatusChangeMany(Array.from(selectedIds), numStatus === 1 ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default NoiLuuToolbar;
