import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Upload, Tag } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { useKhoStore } from '../store/useKhoStore';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import type { Kho } from '../core/types';

interface Props {
  khoList: Kho[];
  selectedCount: number;
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: () => void;
  onStatusChangeMany: (status: 0 | 1) => void;
}

const DanhSachKhoToolbar: React.FC<Props> = ({
  khoList,
  selectedCount,
  onAdd,
  onExport,
  onImport,
  onDeleteMany,
  onStatusChangeMany,
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
  } = useKhoStore();

  const activeFilterCount = useMemo(
    () => (searchTerm ? 1 : 0) + (filters.status.length > 0 ? 1 : 0),
    [searchTerm, filters.status.length]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
  };

  const statusOptions = useMemo(
    () => [
      {
        label: t('common.activeStatus'),
        value: 'Active',
        count: khoList.filter((k) => k.trang_thai === 1).length,
      },
      {
        label: t('common.inactiveStatus'),
        value: 'Inactive',
        count: khoList.filter((k) => k.trang_thai === 0).length,
      },
    ],
    [khoList, t]
  );

  const renderFilters = (
    <FilterChipMultiSelect
      options={statusOptions}
      value={filters.status}
      onChange={(v) => setFilter('status', v)}
      placeholder={t('common.status')}
      icon={Tag}
      className="w-full sm:w-[140px]"
    />
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('common.status'),
        icon: Tag,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
    ],
    [filters.status, setFilter, t, statusOptions]
  );

  const mobileActions = useMemo(
    () => [
      {
        key: 'import',
        label: t('common.import'),
        icon: Upload,
        onClick: onImport,
        description: '',
      },
      {
        key: 'export',
        label: t('common.export'),
        icon: Download,
        onClick: onExport,
        description: '',
      },
    ],
    [onImport, onExport, t]
  );

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.import')} placement="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
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
        <span className="hidden sm:inline">{t('common.addNew')}</span>
      </Button>
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      onDeleteMany={onDeleteMany}
      onStatusChangeMany={onStatusChangeMany}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={onAdd}
      showBack
      searchPlaceholder={t('kho.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
    />
  );
};

export default DanhSachKhoToolbar;
