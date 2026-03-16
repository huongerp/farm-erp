import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Warehouse, ArrowRightLeft } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { usePhieuKhoStore } from '../store/usePhieuKhoStore';
import type { PhieuKho, LoaiPhieuKhoTab } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';

interface Props {
  data: PhieuKho[];
  loai: LoaiPhieuKhoTab;
  khoList: Kho[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const PhieuKhoToolbar: React.FC<Props> = ({ data, loai, khoList, selectedCount, onAdd, onDeleteMany, canCreate = true, canDelete = true }) => {
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
  } = usePhieuKhoStore();

  const isChuyen = loai === 'chuyen';
  const isNhap = loai === 'nhap';
  const labelKho = isNhap ? t('phieuKho.form.warehouseTo') : t('phieuKho.form.warehouseFrom');

  const statusLen = filters.status?.length ?? 0;
  const khoIdsLen = filters.khoIds?.length ?? 0;
  const khoDenIdsLen = filters.khoDenIds?.length ?? 0;
  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (statusLen > 0 ? 1 : 0) +
      (khoIdsLen > 0 ? 1 : 0) +
      (khoDenIdsLen > 0 ? 1 : 0),
    [searchTerm, statusLen, khoIdsLen, khoDenIdsLen]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('khoIds', []);
    setFilter('khoDenIds', []);
  };

  const statusOptions = useMemo(
    () => [
      { label: t('phieuKho.status.pending'), value: 'Pending', count: data.filter((d) => d.trang_thai === 'Chờ duyệt').length },
      { label: t('phieuKho.status.approved'), value: 'Approved', count: data.filter((d) => d.trang_thai === 'Đã duyệt').length },
      { label: t('phieuKho.status.rejected'), value: 'Rejected', count: data.filter((d) => d.trang_thai === 'Không duyệt').length },
    ],
    [data, t]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: data.filter((d) => d.kho_id === k.id).length,
      })),
    [khoList, data]
  );

  const khoDenOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: data.filter((d) => d.kho_den_id === k.id).length,
      })),
    [khoList, data]
  );

  const filterGroups = useMemo(() => {
    const groups = [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status ?? [],
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'khoIds',
        label: labelKho,
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoIds ?? [],
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
    ];
    if (isChuyen) {
      groups.push({
        key: 'khoDenIds',
        label: t('phieuKho.form.warehouseTo'),
        icon: ArrowRightLeft,
        options: khoDenOptions,
        value: filters.khoDenIds ?? [],
        onChange: (val: string[]) => setFilter('khoDenIds', val),
      });
    }
    return groups;
  }, [
    t,
    statusOptions,
    filters.status,
    filters.khoIds,
    filters.khoDenIds,
    setFilter,
    labelKho,
    khoOptions,
    khoDenOptions,
    isChuyen,
  ]);

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
        options={khoOptions}
        value={filters.khoIds ?? []}
        onChange={(v) => setFilter('khoIds', v)}
        placeholder={labelKho}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      {isChuyen && (
        <FilterChipMultiSelect
          options={khoDenOptions}
          value={filters.khoDenIds ?? []}
          onChange={(v) => setFilter('khoDenIds', v)}
          placeholder={t('phieuKho.form.warehouseTo')}
          icon={ArrowRightLeft}
          className="w-full sm:w-[160px]"
        />
      )}
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
      onDeleteMany={canDelete ? onDeleteMany : undefined}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      showBack
      searchPlaceholder={t('phieuKho.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default PhieuKhoToolbar;
