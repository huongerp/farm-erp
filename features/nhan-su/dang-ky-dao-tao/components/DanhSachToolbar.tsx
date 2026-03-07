import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ClipboardList } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDangKyDaoTaoStore } from '../store/useDangKyDaoTaoStore';
import { TRANG_THAI_DANG_KY_VALUES, getTrangThaiDangKyLabel } from '../core/constants';
import type { DangKyThamGia } from '../core/types';

interface Props {
  items: DangKyThamGia[];
  onGiaoKhoa?: () => void;
  onDeleteMany: (ids: string[]) => void;
  showGiaoKhoa?: boolean;
}

const DanhSachToolbar: React.FC<Props> = ({
  items,
  onGiaoKhoa,
  onDeleteMany,
  showGiaoKhoa = false,
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
  } = useDangKyDaoTaoStore();

  const selectedCount = selectedIds.size;

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_DANG_KY_VALUES.map((value) => ({
        label: getTrangThaiDangKyLabel(value, t),
        value: String(value),
        count: items.filter((i) => i.trang_thai === value).length,
      })),
    [t, items]
  );

  const idKhoaHocOptions = useMemo(() => {
    const byId = new Map<string, { label: string; count: number }>();
    for (const i of items) {
      const key = i.id_khoa_hoc;
      const label = i.ten_khoa_hoc ?? i.ma_khoa_hoc ?? key;
      const prev = byId.get(key);
      byId.set(key, {
        label,
        count: (prev?.count ?? 0) + 1,
      });
    }
    return Array.from(byId.entries()).map(([value, { label, count }]) => ({
      value,
      label,
      count,
    }));
  }, [items]);

  const activeFilterCount =
    filters.trang_thai.length + filters.id_khoa_hoc.length + filters.id_loai_khoa_hoc.length;
  const handleClearAllFilters = () => resetFilters();

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trang_thai}
        onChange={(val) => setFilter('trang_thai', val)}
        placeholder={t('dangKyDaoTao.filterTrangThai')}
        icon={ClipboardList}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={idKhoaHocOptions}
        value={filters.id_khoa_hoc}
        onChange={(val) => setFilter('id_khoa_hoc', val)}
        placeholder={t('dangKyDaoTao.filterKhoa')}
        icon={ClipboardList}
        className="w-full sm:w-[180px]"
      />
    </>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'trang_thai',
        label: t('dangKyDaoTao.table.trangThai'),
        icon: ClipboardList,
        options: trangThaiOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
      {
        key: 'id_khoa_hoc',
        label: t('dangKyDaoTao.filterKhoa'),
        icon: ClipboardList,
        options: idKhoaHocOptions,
        value: filters.id_khoa_hoc,
        onChange: (val: string[]) => setFilter('id_khoa_hoc', val),
      },
    ],
    [trangThaiOptions, idKhoaHocOptions, filters.trang_thai, filters.id_khoa_hoc, setFilter, t]
  );

  const renderActions = (
    <div className="flex items-center gap-2">
      {showGiaoKhoa && onGiaoKhoa && (
        <Button
          onClick={onGiaoKhoa}
          size="sm"
          className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('dangKyDaoTao.giaoKhoa')}</span>
        </Button>
      )}
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
      searchPlaceholder={t('dangKyDaoTao.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={selectedCount > 0 ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default DanhSachToolbar;
