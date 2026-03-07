import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Filter, Briefcase, Tag } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useUngVienStore } from '../store/useUngVienStore';
import { useDeXuatTuyenDungs } from '@/features/nhan-su/de-xuat-tuyen-dung/hooks/use-de-xuat-tuyen-dung';
import { useTrangThaiUngViens } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-trang-thai-ung-vien';
import { useKenhTuyenDungs } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-kenh-tuyen-dung';
import type { UngVien } from '../core/types';

interface Props {
  items?: UngVien[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const DanhSachToolbar: React.FC<Props> = ({ items = [], onAdd, onDeleteMany }) => {
  const { t } = useTranslation();
  const { data: deXuatList = [] } = useDeXuatTuyenDungs();
  const { data: trangThaiList = [] } = useTrangThaiUngViens();
  const { data: kenhList = [] } = useKenhTuyenDungs();
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
  } = useUngVienStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount =
    filters.id_trang_thai_ung_vien.length +
    filters.id_de_xuat_tuyen_dung.length +
    filters.id_kenh_tuyen_dung.length;
  const handleClearAllFilters = () => {
    setFilter('id_trang_thai_ung_vien', []);
    setFilter('id_de_xuat_tuyen_dung', []);
    setFilter('id_kenh_tuyen_dung', []);
  };

  const trangThaiOptions = useMemo(
    () =>
      trangThaiList.map((s) => ({
        label: s.ten,
        value: s.id,
        count: items.filter((i) => i.id_trang_thai_ung_vien === s.id).length,
      })),
    [trangThaiList, items]
  );
  const viTriOptions = useMemo(
    () =>
      deXuatList.map((d) => ({
        label: `${d.ma_de_xuat}${d.ten_chuc_vu ? ` · ${d.ten_chuc_vu}` : ''}`,
        value: d.id,
        count: items.filter((i) => i.id_de_xuat_tuyen_dung === d.id).length,
      })),
    [deXuatList, items]
  );
  const nguonOptions = useMemo(
    () =>
      kenhList.map((k) => ({
        label: k.ten,
        value: k.id,
        count: items.filter((i) => i.id_kenh_tuyen_dung === k.id).length,
      })),
    [kenhList, items]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={trangThaiOptions}
        value={filters.id_trang_thai_ung_vien}
        onChange={(val) => setFilter('id_trang_thai_ung_vien', val)}
        placeholder={t('ungVien.filterTrangThai')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={viTriOptions}
        value={filters.id_de_xuat_tuyen_dung}
        onChange={(val) => setFilter('id_de_xuat_tuyen_dung', val)}
        placeholder={t('ungVien.filterViTri')}
        icon={Briefcase}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={nguonOptions}
        value={filters.id_kenh_tuyen_dung}
        onChange={(val) => setFilter('id_kenh_tuyen_dung', val)}
        placeholder={t('ungVien.filterNguon')}
        icon={Filter}
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
      <span className="hidden sm:inline">{t('ungVien.add')}</span>
    </Button>
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'id_trang_thai_ung_vien',
        label: t('ungVien.filterTrangThai'),
        icon: Tag,
        options: trangThaiOptions,
        value: filters.id_trang_thai_ung_vien,
        onChange: (val: string[]) => setFilter('id_trang_thai_ung_vien', val),
      },
      {
        key: 'id_de_xuat_tuyen_dung',
        label: t('ungVien.filterViTri'),
        icon: Briefcase,
        options: viTriOptions,
        value: filters.id_de_xuat_tuyen_dung,
        onChange: (val: string[]) => setFilter('id_de_xuat_tuyen_dung', val),
      },
      {
        key: 'id_kenh_tuyen_dung',
        label: t('ungVien.filterNguon'),
        icon: Filter,
        options: nguonOptions,
        value: filters.id_kenh_tuyen_dung,
        onChange: (val: string[]) => setFilter('id_kenh_tuyen_dung', val),
      },
    ],
    [t, trangThaiOptions, viTriOptions, nguonOptions, filters, setFilter]
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
      searchPlaceholder={t('ungVien.searchPlaceholder')}
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
