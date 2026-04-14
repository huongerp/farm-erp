import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Warehouse, User, UserCheck } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { usePhieuKiemKeStore } from '../store/usePhieuKiemKeStore';
import type { PhieuKiemKe } from '../core/types';
import type { Kho } from '../../danh-sach-kho/core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { TRANG_THAI_KIEM_KE } from '../core/constants';

interface Props {
  data: PhieuKiemKe[];
  khoList: Kho[];
  employees: EmployeeRef[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
}

const PhieuKiemKeToolbar: React.FC<Props> = ({
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
  } = usePhieuKiemKeStore();

  const statusLen = filters.status?.length ?? 0;
  const khoLen = filters.khoIds?.length ?? 0;
  const nguoiThucHienLen = filters.nguoiThucHienIds?.length ?? 0;
  const nguoiDuyetLen = filters.nguoiDuyetIds?.length ?? 0;
  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (statusLen > 0 ? 1 : 0) +
      (khoLen > 0 ? 1 : 0) +
      (nguoiThucHienLen > 0 ? 1 : 0) +
      (nguoiDuyetLen > 0 ? 1 : 0),
    [searchTerm, statusLen, khoLen, nguoiThucHienLen, nguoiDuyetLen]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('khoIds', []);
    setFilter('nguoiThucHienIds', []);
    setFilter('nguoiDuyetIds', []);
  };

  const statusLabelKey: Record<string, string> = {
    'Nháp': 'phieuKiemKe.status.nhap',
    'Đang kiểm': 'phieuKiemKe.status.dangKiem',
    'Chờ duyệt': 'phieuKiemKe.status.choDuyet',
    'Hoàn thành': 'phieuKiemKe.status.hoanThanh',
    'Đã duyệt': 'phieuKiemKe.status.daDuyet',
    'Không duyệt': 'phieuKiemKe.status.khongDuyet',
  };
  const statusOptions = useMemo(
    () =>
      TRANG_THAI_KIEM_KE.map((s) => ({
        label: t(statusLabelKey[s] ?? s),
        value: s,
        count: data.filter((d) => d.trang_thai === s).length,
      })),
    [data, t]
  );

  const khoOptions = useMemo(
    () =>
      khoList.map((k) => ({
        value: k.id,
        label: k.ten_kho,
        count: data.filter((d) => d.id_kho === k.id).length,
      })),
    [khoList, data]
  );

  const nguoiThucHienOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.ho_ten,
        count: data.filter((d) => d.id_nguoi_thuc_hien === e.id).length,
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
        key: 'khoIds',
        label: t('phieuKiemKe.form.warehouse'),
        icon: Warehouse,
        options: khoOptions,
        value: filters.khoIds ?? [],
        onChange: (val: string[]) => setFilter('khoIds', val),
      },
      {
        key: 'nguoiThucHienIds',
        label: t('phieuKiemKe.form.performer'),
        icon: User,
        options: nguoiThucHienOptions,
        value: filters.nguoiThucHienIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiThucHienIds', val),
      },
      {
        key: 'nguoiDuyetIds',
        label: t('phieuKiemKe.form.approver'),
        icon: UserCheck,
        options: nguoiDuyetOptions,
        value: filters.nguoiDuyetIds ?? [],
        onChange: (val: string[]) => setFilter('nguoiDuyetIds', val),
      },
    ],
    [t, statusOptions, khoOptions, nguoiThucHienOptions, nguoiDuyetOptions, filters, setFilter]
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
        options={khoOptions}
        value={filters.khoIds ?? []}
        onChange={(v) => setFilter('khoIds', v)}
        placeholder={t('phieuKiemKe.form.warehouse')}
        icon={Warehouse}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiThucHienOptions}
        value={filters.nguoiThucHienIds ?? []}
        onChange={(v) => setFilter('nguoiThucHienIds', v)}
        placeholder={t('phieuKiemKe.form.performer')}
        icon={User}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={nguoiDuyetOptions}
        value={filters.nguoiDuyetIds ?? []}
        onChange={(v) => setFilter('nguoiDuyetIds', v)}
        placeholder={t('phieuKiemKe.form.approver')}
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
      searchPlaceholder={t('phieuKiemKe.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default PhieuKiemKeToolbar;
