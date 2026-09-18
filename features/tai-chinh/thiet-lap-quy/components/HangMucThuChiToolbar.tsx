import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Power, Tags } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useHangMucThuChiStore } from '../store/useHangMucThuChiStore';
import { LOAI_HANG_MUC, loaiHangMucToI18nKey } from '../core/constants';
import type { HangMucThuChi } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import type { TrangThaiHoatDong } from '../../../../lib/constants';

interface Props {
  items?: HangMucThuChi[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: TrangThaiHoatDong) => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const HangMucThuChiToolbar: React.FC<Props> = ({
  items = [],
  onAdd,
  onDeleteMany,
  onStatusChangeMany,
  canCreate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput } = useGenericToolbarSearch(useHangMucThuChiStore);
  const filters = useHangMucThuChiStore((s) => s.filters);
  const setFilter = useHangMucThuChiStore((s) => s.setFilter);
  const columns = useHangMucThuChiStore((s) => s.columns);
  const toggleColumn = useHangMucThuChiStore((s) => s.toggleColumn);
  const reorderColumns = useHangMucThuChiStore((s) => s.reorderColumns);
  const resetColumns = useHangMucThuChiStore((s) => s.resetColumns);
  const resetColumnWidths = useHangMucThuChiStore((s) => s.resetColumnWidths);
  const selectedIds = useHangMucThuChiStore((s) => s.selectedIds);
  const clearSelection = useHangMucThuChiStore((s) => s.clearSelection);

  const statusOptions = useMemo(
    () => [
      {
        label: t('common.activeStatus'),
        value: 'Active',
        count: items.filter((i) => i.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).length,
      },
      {
        label: t('common.inactiveStatus'),
        value: 'Inactive',
        count: items.filter((i) => i.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG).length,
      },
    ],
    [t, items]
  );

  const loaiOptions = useMemo(
    () =>
      LOAI_HANG_MUC.map((loai) => ({
        label: t(loaiHangMucToI18nKey(loai)),
        value: loai,
        count: items.filter((i) => i.loai === loai).length,
      })),
    [t, items]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'loai',
        label: t('thietLapQuy.hangMuc.store.loaiCol'),
        icon: Tags,
        options: loaiOptions,
        value: filters.loai,
        onChange: (val: string[]) => setFilter('loai', val),
      },
      {
        key: 'status',
        label: t('common.status'),
        icon: Power,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
    ],
    [filters.loai, filters.status, loaiOptions, setFilter, statusOptions, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.loai}
        onChange={(val) => setFilter('loai', val)}
        placeholder={t('thietLapQuy.hangMuc.store.loaiCol')}
        icon={Tags}
        className="w-full sm:w-[150px]"
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('common.status')}
        icon={Power}
        className="w-full sm:w-[150px]"
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
      selectedCount={selectedIds.size}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      activeFilterCount={filters.status.length + filters.loai.length}
      onClearAllFilters={() => {
        setFilter('status', []);
        setFilter('loai', []);
      }}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      onStatusChangeMany={
        canDelete
          ? (numStatus) =>
              onStatusChangeMany(
                Array.from(selectedIds),
                numStatus === 1 ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
              )
          : undefined
      }
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      onResetColumnWidths={resetColumnWidths}
      showBack
    />
  );
};

export default HangMucThuChiToolbar;
