import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Upload, Tag } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { useJobLevelStore } from '../store/useJobLevelStore';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { TRANG_THAI, type TrangThai } from '../../../../lib/constants';

interface Props {
  items?: { trang_thai: string }[];
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: TrangThai) => void;
}

const JobLevelToolbar: React.FC<Props> = ({
  items = [],
  onAdd, onExport, onImport, onDeleteMany, onStatusChangeMany
}) => {
  const { t } = useTranslation();
  const {
    searchTerm, setSearchTerm,
    filters, setFilter,
    columns, toggleColumn, reorderColumns, resetColumns,
    selectedIds, clearSelection
  } = useJobLevelStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length;
  const handleClearAllFilters = () => setFilter('status', []);

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: items.filter((i) => i.trang_thai === TRANG_THAI.DANG_DUNG).length },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: items.filter((i) => i.trang_thai === TRANG_THAI.NGUNG).length },
    ],
    [t, items]
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

  const renderFilters = (
    <FilterChipMultiSelect
      options={statusOptions}
      value={filters.status}
      onChange={(val) => setFilter('status', val)}
      placeholder={t('common.status')}
      icon={Tag}
      className="w-full sm:w-[140px]"
    />
  );

  const mobileActions = useMemo(
    () => [
      { key: 'import', label: t('common.import'), icon: Upload, onClick: onImport, description: '' },
      { key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' },
    ],
    [onImport, onExport, t]
  );

  const renderActions = (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip content={t('common.import')} placement="bottom">
          <Button variant="outline" size="sm" onClick={onImport} className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50">
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content={t('common.export')} placement="bottom">
          <Button variant="outline" size="sm" onClick={onExport} className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted/50">
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
      <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
        <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('common.addNew')}</span>
      </Button>
    </>
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
        mobileActions={mobileActions}
        onAdd={onAdd}
        searchPlaceholder={t('common.searchPlaceholder')}
        activeFilterCount={activeFilterCount}
        onClearAllFilters={handleClearAllFilters}
        onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
        onStatusChangeMany={(numStatus) => onStatusChangeMany(Array.from(selectedIds), numStatus === 1 ? TRANG_THAI.DANG_DUNG : TRANG_THAI.NGUNG)}
        columns={columns}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetColumns={resetColumns}
        showBack
    />
  );
};

export default JobLevelToolbar;