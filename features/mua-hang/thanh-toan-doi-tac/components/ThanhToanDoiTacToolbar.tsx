import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Building2, Users } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useThanhToanDoiTacStore } from '../store/useThanhToanDoiTacStore';
import type { ThanhToanDoiTac } from '../core/types';
import type { DoiTacRefLite } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { TrangThaiThanhToanDoiTac } from '../../thiet-lap-de-xuat-vat-tu/core/types';

interface Props {
  data: ThanhToanDoiTac[];
  doiTacList: DoiTacRefLite[];
  chiNhanhList: Branch[];
  statusList: TrangThaiThanhToanDoiTac[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  canCreate?: boolean;
  canDelete?: boolean;
}

const ThanhToanDoiTacToolbar: React.FC<Props> = ({
  data,
  doiTacList,
  chiNhanhList,
  statusList,
  selectedCount,
  onAdd,
  onDeleteMany,
  canCreate = true,
  canDelete = true,
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
  } = useThanhToanDoiTacStore();

  const statusOptions = useMemo(
    () =>
      statusList.map((s) => ({
        value: s.id,
        label: s.ten,
        count: data.filter((x) => x.id_trang_thai_thanh_toan === s.id).length,
      })),
    [statusList, data]
  );

  const doiTacOptions = useMemo(
    () =>
      doiTacList.map((d) => ({
        value: d.id,
        label: `${d.ma_ncc} - ${d.ten_ncc}`,
        count: data.filter((x) => x.id_doi_tac === d.id).length,
      })),
    [doiTacList, data]
  );

  const donViOptions = useMemo(
    () =>
      chiNhanhList.map((b) => ({
        value: b.id,
        label: b.ten_chi_nhanh,
        count: data.filter((x) => x.id_don_vi === b.id).length,
      })),
    [chiNhanhList, data]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.statusIds?.length ?? 0) +
      (filters.doiTacIds?.length ?? 0) +
      (filters.donViIds?.length ?? 0),
    [searchTerm, filters.statusIds, filters.doiTacIds, filters.donViIds]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('statusIds', []);
    setFilter('doiTacIds', []);
    setFilter('donViIds', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'statusIds',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.statusIds ?? [],
        onChange: (val: string[]) => setFilter('statusIds', val),
      },
      {
        key: 'doiTacIds',
        label: t('thanhToanDoiTac.form.doiTac'),
        icon: Users,
        options: doiTacOptions,
        value: filters.doiTacIds ?? [],
        onChange: (val: string[]) => setFilter('doiTacIds', val),
      },
      {
        key: 'donViIds',
        label: t('thanhToanDoiTac.form.donVi'),
        icon: Building2,
        options: donViOptions,
        value: filters.donViIds ?? [],
        onChange: (val: string[]) => setFilter('donViIds', val),
      },
    ],
    [t, statusOptions, doiTacOptions, donViOptions, filters.statusIds, filters.doiTacIds, filters.donViIds, setFilter]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.statusIds ?? []}
        onChange={(v) => setFilter('statusIds', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={doiTacOptions}
        value={filters.doiTacIds ?? []}
        onChange={(v) => setFilter('doiTacIds', v)}
        placeholder={t('thanhToanDoiTac.form.doiTac')}
        icon={Users}
        className="w-full sm:w-[160px]"
      />
      <FilterChipMultiSelect
        options={donViOptions}
        value={filters.donViIds ?? []}
        onChange={(v) => setFilter('donViIds', v)}
        placeholder={t('thanhToanDoiTac.form.donVi')}
        icon={Building2}
        className="w-full sm:w-[160px]"
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
      searchPlaceholder={t('thanhToanDoiTac.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default ThanhToanDoiTacToolbar;
