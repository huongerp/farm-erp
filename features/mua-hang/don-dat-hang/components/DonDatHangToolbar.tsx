import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Building2, Warehouse, User } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useDonDatHangStore } from '../store/useDonDatHangStore';
import type { DonDatHang } from '../core/types';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { DoiTac } from '../../../kho-van/danh-sach-doi-tac/core/types';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';
import { TRANG_THAI_KEY } from '../core/constants';

interface Props {
  data: DonDatHang[];
  supplierList: DoiTac[];
  khoList: Kho[];
  employees: Employee[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
}

const DonDatHangToolbar: React.FC<Props> = ({
  data,
  supplierList,
  khoList,
  employees,
  selectedCount,
  onAdd,
  onDeleteMany,
}) => {
  const { t } = useTranslation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearSelection,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useDonDatHangStore();

  const statusOptions = useMemo(
    () =>
      ([0, 1, 2, 3, 4, 5, 6, 7] as const).map((s) => ({
        value: String(s),
        label: t(`donDatHang.status.${TRANG_THAI_KEY[s]}`),
        count: data.filter((d) => d.trang_thai === s).length,
      })),
    [data, t]
  );

  const supplierOptions = useMemo(
    () =>
      supplierList.map((d) => ({
        value: d.id,
        label: d.ten_ncc,
        count: data.filter((x) => x.id_nha_cung_cap === d.id).length,
      })),
    [supplierList, data]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: data.filter((x) => x.id_kho_nhan === k.id).length,
      })),
    [khoList, data]
  );

  const buyerOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.ho_ten,
        count: data.filter((x) => x.id_nguoi_dat === e.id).length,
      })),
    [employees, data]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.status?.length ?? 0) +
      (filters.nhaCungCapIds?.length ?? 0) +
      (filters.khoNhanIds?.length ?? 0) +
      (filters.nguoiDatIds?.length ?? 0),
    [searchTerm, filters.status, filters.nhaCungCapIds, filters.khoNhanIds, filters.nguoiDatIds]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('nhaCungCapIds', []);
    setFilter('khoNhanIds', []);
    setFilter('nguoiDatIds', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status ?? [],
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'nhaCungCapIds',
        label: t('donDatHang.form.supplier'),
        icon: Building2,
        options: supplierOptions,
        value: filters.nhaCungCapIds ?? [],
        onChange: (val: string[]) => setFilter('nhaCungCapIds', val),
      },
      {
        key: 'khoNhanIds',
        label: t('donDatHang.form.warehouse'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoNhanIds ?? [],
        onChange: (val: string[]) => setFilter('khoNhanIds', val),
      },
      {
        key: 'nguoiDatIds',
        label: t('donDatHang.form.buyer'),
        icon: User,
        options: buyerOptions,
        value: filters.nguoiDatIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDatIds', val),
      },
    ],
    [
      t,
      statusOptions,
      supplierOptions,
      khoOptions,
      buyerOptions,
      filters.status,
      filters.nhaCungCapIds,
      filters.khoNhanIds,
      filters.nguoiDatIds,
      setFilter,
    ]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status ?? []}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={supplierOptions}
        value={filters.nhaCungCapIds ?? []}
        onChange={(v) => setFilter('nhaCungCapIds', v)}
        placeholder={t('donDatHang.form.supplier')}
        icon={Building2}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={khoOptions}
        value={filters.khoNhanIds ?? []}
        onChange={(v) => setFilter('khoNhanIds', v)}
        placeholder={t('donDatHang.form.warehouse')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={buyerOptions}
        value={filters.nguoiDatIds ?? []}
        onChange={(v) => setFilter('nguoiDatIds', v)}
        placeholder={t('donDatHang.form.buyer')}
        icon={User}
        className="w-full sm:w-[160px]"
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
      <span className="hidden sm:inline">{t('common.addNew')}</span>
    </Button>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={onDeleteMany}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={onAdd}
      showBack
      searchPlaceholder={t('donDatHang.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default DonDatHangToolbar;
