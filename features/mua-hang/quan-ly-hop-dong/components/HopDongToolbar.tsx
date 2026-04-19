import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Building2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useSearchInputCommit } from '../../../../lib/hooks/use-search-input-commit';
import { useHopDongStore } from '../store/useHopDongStore';
import type { HopDong } from '../core/types';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import { TRANG_THAI_HOP_DONG } from '../core/constants';
import type { FilterGroup } from '../../../../components/ui/MobileFilterSheet';

interface Props {
  data: HopDong[];
  doiTacList: DoiTacRefLite[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const HopDongToolbar: React.FC<Props> = ({
  data,
  doiTacList,
  selectedCount,
  onAdd,
  onDeleteMany,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const searchTerm = useHopDongStore((s) => s.searchTerm);
  const commitSearchTerm = useHopDongStore((s) => s.commitSearchTerm);
  const filters = useHopDongStore((s) => s.filters);
  const setFilter = useHopDongStore((s) => s.setFilter);
  const clearSelection = useHopDongStore((s) => s.clearSelection);
  const columns = useHopDongStore((s) => s.columns);
  const toggleColumn = useHopDongStore((s) => s.toggleColumn);
  const reorderColumns = useHopDongStore((s) => s.reorderColumns);
  const resetColumns = useHopDongStore((s) => s.resetColumns);

  const { inputValue: searchInput, setInputValue: setSearchInput } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_HOP_DONG.map((s) => ({
        value: s,
        label: s === 'Đang thực hiện' ? t('hopDong.trangThai.dangThucHien') : t('hopDong.trangThai.daThanhLy'),
        count: data.filter((x) => x.trang_thai === s).length,
      })),
    [data, t]
  );

  const nccOptions = useMemo(
    () =>
      doiTacList.map((d) => ({
        value: d.id,
        label: `${d.ma_ncc} - ${d.ten_ncc}`,
        count: data.filter((x) => x.id_nha_cung_cap === d.id).length,
      })),
    [doiTacList, data]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchInput.trim() ? 1 : 0) + (filters.trangThai?.length ?? 0) + (filters.nccIds?.length ?? 0),
    [searchInput, filters.trangThai, filters.nccIds]
  );

  const handleClearAllFilters = () => {
    commitSearchTerm('');
    setFilter('trangThai', []);
    setFilter('nccIds', []);
  };

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'trangThai',
        label: t('hopDong.toolbar.filterStatus'),
        icon: Tag,
        options: statusOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.trangThai ?? [],
        onChange: (val: string[]) => setFilter('trangThai', val),
      },
      {
        key: 'nccIds',
        label: t('hopDong.toolbar.filterNcc'),
        icon: Building2,
        options: nccOptions.map((o) => ({ label: o.label, value: o.value, count: o.count })),
        value: filters.nccIds ?? [],
        onChange: (val: string[]) => setFilter('nccIds', val),
      },
    ],
    [t, statusOptions, nccOptions, filters.trangThai, filters.nccIds, setFilter]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.trangThai ?? []}
        onChange={(v) => setFilter('trangThai', v)}
        placeholder={t('hopDong.toolbar.filterStatus')}
        icon={Tag}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nccOptions}
        value={filters.nccIds ?? []}
        onChange={(v) => setFilter('nccIds', v)}
        placeholder={t('hopDong.toolbar.filterNcc')}
        icon={Building2}
        className="w-full sm:w-[180px]"
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
      <span className="hidden sm:inline">{t('hopDong.toolbar.add')}</span>
    </Button>
  ) : null;

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
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('hopDong.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default HopDongToolbar;
