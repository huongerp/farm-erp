import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Download, Upload, MapPin } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { usePayrollWifiIpStore } from '../store/usePayrollWifiIpStore';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { PayrollWifiIp } from '../core/types';

interface Props {
  /** Danh sách IP để đếm count. */
  items?: PayrollWifiIp[];
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong) => void;
}

const PayrollWifiIpToolbar: React.FC<Props> = ({ items = [], onAdd, onImport, onExport, onDeleteMany, onStatusChangeMany }) => {
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
  } = usePayrollWifiIpStore();
  const { data: branches = [] } = useBranches();

  const counts = useMemo(() => {
    const statusCounts: Record<string, number> = { Active: 0, Inactive: 0 };
    const branchCounts: Record<string, number> = {};
    for (const item of items) {
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      if (filters.id_chi_nhanh.length === 0 || filters.id_chi_nhanh.includes(item.id_chi_nhanh)) {
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
      }
      if (filters.status.length === 0 || filters.status.includes(statusKey)) {
        branchCounts[item.id_chi_nhanh] = (branchCounts[item.id_chi_nhanh] || 0) + 1;
      }
    }
    return { statusCounts, branchCounts };
  }, [items, filters.status, filters.id_chi_nhanh]);

  const selectedCount = selectedIds.size;
  const activeFilterCount = filters.status.length + filters.id_chi_nhanh.length;
  const handleClearAllFilters = () => {
    setFilter('status', []);
    setFilter('id_chi_nhanh', []);
  };

  const statusOptions = useMemo(
    () => [
      { label: t('common.activeStatus'), value: 'Active', count: counts.statusCounts['Active'] ?? 0 },
      { label: t('common.inactiveStatus'), value: 'Inactive', count: counts.statusCounts['Inactive'] ?? 0 },
    ],
    [t, counts.statusCounts]
  );
  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        label: b.ten_chi_nhanh,
        value: b.id,
        subLabel: b.ma_chi_nhanh,
        count: counts.branchCounts[b.id] ?? 0,
      })),
    [branches, counts.branchCounts]
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
      {
        key: 'id_chi_nhanh',
        label: t('payrollIp.form.branch'),
        icon: MapPin,
        options: branchOptions,
        value: filters.id_chi_nhanh,
        onChange: (val: string[]) => setFilter('id_chi_nhanh', val),
      },
    ],
    [filters.status, filters.id_chi_nhanh, setFilter, statusOptions, branchOptions, t]
  );

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('common.status')}
        icon={Tag}
        className="w-full sm:w-[140px]"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.id_chi_nhanh}
        onChange={(val) => setFilter('id_chi_nhanh', val)}
        placeholder={t('payrollIp.form.branch')}
        icon={MapPin}
        className="w-full sm:w-[200px]"
      />
    </>
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
      <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
        <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('common.addNew')}</span>
      </Button>
    </>
  );

  const mobileActions = useMemo(
    () => [
      { key: 'import', label: t('common.import'), icon: Upload, onClick: onImport, description: '' },
      { key: 'export', label: t('common.export'), icon: Download, onClick: onExport, description: '' },
    ],
    [onExport, onImport, t]
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
      searchPlaceholder={t('payrollIp.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      onStatusChangeMany={(numStatus) => onStatusChangeMany(Array.from(selectedIds), numStatus === 1 ? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG : TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG)}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
};

export default PayrollWifiIpToolbar;
