import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, BookOpen, Activity } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useKhoaDaoTaoStore } from '../store/useKhoaDaoTaoStore';
import { useLoaiKhoaHocs } from '@/features/nhan-su/thiet-lap-dao-tao/hooks/use-loai-khoa-hoc';
import {
  TRANG_THAI_KHOA_VALUES,
  getTrangThaiKhoaDaoTaoLabel,
} from '../core/constants';
import type { KhoaDaoTao } from '../core/types';

interface Props {
  items?: KhoaDaoTao[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const DanhSachToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany }) => {
  const { t } = useTranslation();
  const { data: loaiList = [] } = useLoaiKhoaHocs();
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
  } = useKhoaDaoTaoStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    filters.trang_thai.length + filters.id_loai_khoa_hoc.length;

  const handleClearAllFilters = () => {
    setFilter('trang_thai', []);
    setFilter('id_loai_khoa_hoc', []);
  };

  const loaiOptions = useMemo(
    () =>
      loaiList.map((l) => ({
        label: l.ten,
        value: l.id,
        count: items.filter((i) => i.id_loai_khoa_hoc === l.id).length,
      })),
    [loaiList, items]
  );

  const trangThaiOptions = useMemo(
    () =>
      TRANG_THAI_KHOA_VALUES.map((value) => ({
        label: getTrangThaiKhoaDaoTaoLabel(value, t),
        value: String(value),
        count: items.filter((i) => i.trang_thai === value).length,
      })),
    [t, items]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.id_loai_khoa_hoc}
        onChange={(val) => setFilter('id_loai_khoa_hoc', val)}
        placeholder={t('khoaDaoTao.filterLoaiKhoaHoc')}
        icon={BookOpen}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.trang_thai}
        onChange={(val) => setFilter('trang_thai', val)}
        placeholder={t('khoaDaoTao.table.trangThai')}
        icon={Activity}
        className="w-full sm:w-[140px]"
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
      <span className="hidden sm:inline">{t('khoaDaoTao.add')}</span>
    </Button>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_loai_khoa_hoc',
        label: t('khoaDaoTao.filterLoaiKhoaHoc'),
        icon: BookOpen,
        options: loaiOptions,
        value: filters.id_loai_khoa_hoc,
        onChange: (val: string[]) => setFilter('id_loai_khoa_hoc', val),
      },
      {
        key: 'trang_thai',
        label: t('khoaDaoTao.table.trangThai'),
        icon: Activity,
        options: trangThaiOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
    ],
    [t, loaiOptions, trangThaiOptions, filters, setFilter]
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
      searchPlaceholder={t('khoaDaoTao.searchPlaceholder')}
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
