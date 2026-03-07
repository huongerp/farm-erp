import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Wallet, Download } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useTaiKhoanStore } from '../store/useTaiKhoanStore';
import type { TaiKhoan } from '../../core/types';

interface Props {
  data: TaiKhoan[];
  selectedCount: number;
  onAdd: () => void;
  onDeleteMany: () => void;
  onExport: () => void;
}

const TaiKhoanToolbar: React.FC<Props> = ({
  data,
  selectedCount,
  onAdd,
  onDeleteMany,
  onExport,
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
  } = useTaiKhoanStore();

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.status.length > 0 ? 1 : 0) +
      (filters.loai.length > 0 ? 1 : 0),
    [searchTerm, filters.status.length, filters.loai.length]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('loai', []);
  };

  const statusOptions = useMemo(
    () => [
      {
        label: t('common.activeStatus'),
        value: 'Active',
        count: data.filter((d) => d.trang_thai === 1).length,
      },
      {
        label: t('common.inactiveStatus'),
        value: 'Inactive',
        count: data.filter((d) => d.trang_thai === 0).length,
      },
    ],
    [data, t]
  );

  const loaiOptions = useMemo(
    () => [
      {
        label: t('taiKhoan.loaiTienMat'),
        value: 'tien_mat',
        count: data.filter((d) => d.loai_tai_khoan === 'tien_mat').length,
      },
      {
        label: t('taiKhoan.loaiNganHang'),
        value: 'ngan_hang',
        count: data.filter((d) => d.loai_tai_khoan === 'ngan_hang').length,
      },
    ],
    [data, t]
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('taiKhoan.columns.trangThai'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'loai',
        label: t('taiKhoan.columns.loai'),
        icon: Wallet,
        options: loaiOptions,
        value: filters.loai,
        onChange: (val: string[]) => setFilter('loai', val),
      },
    ],
    [filters.status, filters.loai, setFilter, t, statusOptions, loaiOptions]
  );

  const mobileActions = useMemo(
    () => [
      {
        key: 'export',
        label: t('common.export'),
        icon: Download,
        onClick: onExport,
        description: '',
      },
    ],
    [onExport, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(v) => setFilter('status', v)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={loaiOptions}
        value={filters.loai}
        onChange={(v) => setFilter('loai', v)}
        placeholder={t('taiKhoan.columns.loai')}
        icon={Wallet}
        className="w-full sm:w-[140px]"
      />
    </>
  );

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.export')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
          >
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      <Button
        onClick={onAdd}
        size="sm"
        className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4"
      >
        <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('taiKhoan.addItem')}</span>
      </Button>
    </>
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
      mobileActions={mobileActions}
      onAdd={onAdd}
      showBack
      searchPlaceholder={t('taiKhoan.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default TaiKhoanToolbar;
