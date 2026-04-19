import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CreditCard } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';
import { useTrangThaiThanhToanDoiTacStore } from '../store/useTrangThaiThanhToanDoiTacStore';
import type { TrangThaiThanhToanDoiTac } from '../core/types';
import type { TrangThaiHoatDong } from '../../../../lib/constants';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

interface Props {
  items?: TrangThaiThanhToanDoiTac[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: TrangThaiHoatDong) => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const TrangThaiThanhToanDoiTacToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany, onStatusChangeMany, canCreate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(useTrangThaiThanhToanDoiTacStore);
  const filters = useTrangThaiThanhToanDoiTacStore((s) => s.filters);
  const setFilter = useTrangThaiThanhToanDoiTacStore((s) => s.setFilter);
  const columns = useTrangThaiThanhToanDoiTacStore((s) => s.columns);
  const toggleColumn = useTrangThaiThanhToanDoiTacStore((s) => s.toggleColumn);
  const reorderColumns = useTrangThaiThanhToanDoiTacStore((s) => s.reorderColumns);
  const resetColumns = useTrangThaiThanhToanDoiTacStore((s) => s.resetColumns);
  const selectedIds = useTrangThaiThanhToanDoiTacStore((s) => s.selectedIds);
  const clearSelection = useTrangThaiThanhToanDoiTacStore((s) => s.clearSelection);

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length;
  const handleClearAllFilters = () => setFilter('status', []);

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: items.filter((i) => i.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG).length },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: items.filter((i) => i.trang_thai === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG).length },
    ],
    [t, items]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: CreditCard,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
    ],
    [filters.status, setFilter, statusOptions, t]
  );

  const renderFilters = (
    <FilterChipMultiSelect
      options={statusOptions}
      value={filters.status}
      onChange={(val) => setFilter('status', val)}
      placeholder={t('common.status')}
      icon={CreditCard}
      className="w-full sm:w-[140px]"
    />
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
      searchPlaceholder={t('thietLapDeXuatVatTu.thanhToan.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      onStatusChangeMany={canDelete ? (numStatus) => onStatusChangeMany(Array.from(selectedIds), numStatus === 1 ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default TrangThaiThanhToanDoiTacToolbar;
