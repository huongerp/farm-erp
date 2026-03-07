import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Tag, LogOut } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { useLoginDeviceStore } from '../store/useLoginDeviceStore';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';

interface Props {
  devices: { id: string; trang_thai: number; la_thiet_bi_hien_tai: boolean }[];
  onExport: () => void;
  onLogoutMany: (ids: string[]) => void;
}

const LoginDeviceToolbar: React.FC<Props> = ({
  devices,
  onExport,
  onLogoutMany,
}) => {
  const { t } = useTranslation();
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
  } = useLoginDeviceStore();

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length;
  const handleClearAllFilters = () => setFilter('status', []);

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: devices.filter((d) => d.trang_thai === 1).length },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: devices.filter((d) => d.trang_thai === 0).length },
    ],
    [t, devices]
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
      onChange={(v) => setFilter('status', v)}
      placeholder={t('common.status')}
      icon={Tag}
      className="w-full sm:w-[140px]"
    />
  );

  const selectedIdsArray = Array.from(selectedIds);
  const logoutableIds = useMemo(
    () =>
      selectedIdsArray.filter((id) => {
        const d = devices.find((x) => x.id === id);
        return d && d.trang_thai === 1 && !d.la_thiet_bi_hien_tai;
      }),
    [selectedIdsArray, devices]
  );
  const canLogoutMany = logoutableIds.length > 0;

  const handleLogoutMany = useCallback(() => {
    if (!canLogoutMany) return;
    onLogoutMany(logoutableIds);
    clearSelection();
  }, [canLogoutMany, logoutableIds, onLogoutMany, clearSelection]);

  const bulkActions = useMemo(
    () => (
      <Tooltip
        content={
          canLogoutMany
            ? t('loginDevices.logoutDevice')
            : t('loginDevices.cannotLogoutCurrent')
        }
        placement="bottom"
      >
        <button
          onClick={handleLogoutMany}
          disabled={!canLogoutMany}
          className={`
            min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg
            transition-all active:scale-95
            ${
              canLogoutMany
                ? 'text-amber-600 hover:bg-amber-500/10 border border-amber-500/30'
                : 'text-muted-foreground/50 cursor-not-allowed border border-border'
            }
          `}
        >
          <LogOut size={14} className="stroke-[2.5px]" />
        </button>
      </Tooltip>
    ),
    [canLogoutMany, handleLogoutMany, t]
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

  const renderActions = (
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
  );

  return (
    <GenericToolbar
      selectedCount={selectedCount}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      bulkActions={bulkActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      searchPlaceholder={t('loginDevices.toolbar.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default LoginDeviceToolbar;
