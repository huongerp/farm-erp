import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Warehouse, User, UserCheck } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { usePhieuDeXuatVatTuStore } from '../store/usePhieuDeXuatVatTuStore';
import type { PhieuDeXuatVatTu } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { Employee } from '../../../he-thong/nhan-vien/core/types';

interface Props {
  data: PhieuDeXuatVatTu[];
  khoList: Kho[];
  employees: Employee[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
}

const PhieuDeXuatVatTuToolbar: React.FC<Props> = ({
  data,
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
  } = usePhieuDeXuatVatTuStore();

  const statusLen = filters.status?.length ?? 0;
  const noiDeXuatLen = filters.noiDeXuatIds?.length ?? 0;
  const nguoiDeXuatLen = filters.nguoiDeXuatIds?.length ?? 0;
  const nguoiDuyetLen = filters.nguoiDuyetIds?.length ?? 0;
  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (statusLen > 0 ? 1 : 0) +
      (noiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDeXuatLen > 0 ? 1 : 0) +
      (nguoiDuyetLen > 0 ? 1 : 0),
    [searchTerm, statusLen, noiDeXuatLen, nguoiDeXuatLen, nguoiDuyetLen]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('noiDeXuatIds', []);
    setFilter('nguoiDeXuatIds', []);
    setFilter('nguoiDuyetIds', []);
  };

  const statusOptions = useMemo(
    () => [
      {
        label: t('phieuDeXuatVatTu.status.pending'),
        value: 'Pending',
        count: data.filter((d) => d.trang_thai === 0).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.approved'),
        value: 'Approved',
        count: data.filter((d) => d.trang_thai === 1).length,
      },
      {
        label: t('phieuDeXuatVatTu.status.rejected'),
        value: 'Rejected',
        count: data.filter((d) => d.trang_thai === 2).length,
      },
    ],
    [data, t]
  );

  const noiDeXuatOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: data.filter((d) => d.id_noi_de_xuat === k.id).length,
      })),
    [khoList, data]
  );

  const nguoiDeXuatOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.ho_ten,
        count: data.filter((d) => d.id_nguoi_de_xuat === e.id).length,
      })),
    [employees, data]
  );

  const nguoiDuyetOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.ho_ten,
        count: data.filter((d) => d.id_nguoi_duyet === e.id).length,
      })),
    [employees, data]
  );

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
        key: 'noiDeXuatIds',
        label: t('phieuDeXuatVatTu.form.place'),
        icon: Warehouse,
        options: noiDeXuatOptions,
        value: filters.noiDeXuatIds ?? [],
        onChange: (val: string[]) => setFilter('noiDeXuatIds', val),
      },
      {
        key: 'nguoiDeXuatIds',
        label: t('phieuDeXuatVatTu.form.requester'),
        icon: User,
        options: nguoiDeXuatOptions,
        value: filters.nguoiDeXuatIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDeXuatIds', val),
      },
      {
        key: 'nguoiDuyetIds',
        label: t('phieuDeXuatVatTu.form.approver'),
        icon: UserCheck,
        options: nguoiDuyetOptions,
        value: filters.nguoiDuyetIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDuyetIds', val),
      },
    ],
    [
      t,
      statusOptions,
      noiDeXuatOptions,
      nguoiDeXuatOptions,
      nguoiDuyetOptions,
      filters.status,
      filters.noiDeXuatIds,
      filters.nguoiDeXuatIds,
      filters.nguoiDuyetIds,
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
        options={noiDeXuatOptions}
        value={filters.noiDeXuatIds ?? []}
        onChange={(v) => setFilter('noiDeXuatIds', v)}
        placeholder={t('phieuDeXuatVatTu.form.place')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiDeXuatOptions}
        value={filters.nguoiDeXuatIds ?? []}
        onChange={(v) => setFilter('nguoiDeXuatIds', v)}
        placeholder={t('phieuDeXuatVatTu.form.requester')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={filters.nguoiDuyetIds ?? []}
        onChange={(v) => setFilter('nguoiDuyetIds', v)}
        placeholder={t('phieuDeXuatVatTu.form.approver')}
        icon={UserCheck}
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
      searchPlaceholder={t('phieuDeXuatVatTu.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default PhieuDeXuatVatTuToolbar;
