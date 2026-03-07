import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Download, Building2 } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useAttendanceHistoryStore } from '../store/useAttendanceHistoryStore';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { AttendanceLog } from '../core/types';

interface Props {
  /** Danh sách log chấm công để đếm count theo trạng thái/chi nhánh. */
  items?: AttendanceLog[];
  onExport: () => void;
}

const AttendanceHistoryToolbar: React.FC<Props> = ({ items = [], onExport }) => {
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
    selectedIds,
  } = useAttendanceHistoryStore();

  const { data: branches = [] } = useBranches();

  const counts = useMemo(() => {
    const statusCounts: Record<string, number> = { late: 0, on_time: 0, missing: 0 };
    const branchCounts: Record<string, number> = {};
    for (const item of items) {
      const status = !item.check_in ? 'missing' : item.is_late ? 'late' : 'on_time';
      if (filters.branch.length === 0 || (item.branch_name && filters.branch.includes(item.branch_name))) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
      if (filters.status.length === 0 || filters.status.includes(status)) {
        const key = item.branch_name ?? '';
        if (key) branchCounts[key] = (branchCounts[key] || 0) + 1;
      }
    }
    return { statusCounts, branchCounts };
  }, [items, filters.status, filters.branch]);

  const statusOptions = useMemo(
    () => [
      { label: t('attendance.history.statusLate'), value: 'late', count: counts.statusCounts['late'] ?? 0 },
      { label: t('attendance.history.statusOnTime'), value: 'on_time', count: counts.statusCounts['on_time'] ?? 0 },
      { label: t('attendance.history.statusMissing'), value: 'missing', count: counts.statusCounts['missing'] ?? 0 },
    ],
    [t, counts.statusCounts]
  );

  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === 1)
        .map((b) => ({ label: b.ten_chi_nhanh, value: b.ten_chi_nhanh, count: counts.branchCounts[b.ten_chi_nhanh] ?? 0 })),
    [branches, counts.branchCounts]
  );

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      filters.status.length +
      filters.branch.length +
      (filters.month ? 1 : 0),
    [searchTerm, filters]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('status', []);
    setFilter('branch', []);
    setFilter('month', '');
  };

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('attendance.history.statusCol')}
        icon={Clock}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.branch}
        onChange={(val) => setFilter('branch', val)}
        placeholder={t('attendance.history.branchCol')}
        icon={Building2}
        className="w-full sm:w-[200px]"
      />
      <div className="relative w-full sm:w-[170px]">
        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="month"
          value={filters.month}
          onChange={(e) => setFilter('month', e.target.value)}
          className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>
    </>
  );

  const bulkActions =
    selectedIds.size > 0 ? (
      <button
        onClick={onExport}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-primary/40 text-primary bg-primary/10 hover:bg-primary/15 transition-all active:scale-95 text-xs font-semibold"
      >
        <Download size={14} />
        {t('attendance.bulk.export')}
      </button>
    ) : undefined;

  const filterGroups = useMemo(
    () => [
      {
        key: 'status',
        label: t('attendance.history.statusCol'),
        icon: Clock,
        options: statusOptions,
        value: filters.status,
        onChange: (val: string[]) => setFilter('status', val),
      },
      {
        key: 'branch',
        label: t('attendance.history.branchCol'),
        icon: Building2,
        options: branchOptions,
        value: filters.branch,
        onChange: (val: string[]) => setFilter('branch', val),
      },
    ],
    [statusOptions, branchOptions, filters.status, filters.branch, setFilter, t]
  );

  const mobileActions = useMemo(
    () => [
      {
        key: 'export',
        label: t('attendance.bulk.export'),
        icon: Download,
        onClick: onExport,
      },
    ],
    [onExport, t]
  );

  return (
    <GenericToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      filters={renderFilters}
      bulkActions={bulkActions}
      actions={
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground transition-all active:scale-95 text-xs font-medium"
        >
          <Download size={14} />
          {t('attendance.bulk.export')}
        </button>
      }
      searchPlaceholder={t('attendance.history.searchPlaceholder')}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
      filterGroups={filterGroups}
      mobileActions={mobileActions}
    />
  );
};

export default AttendanceHistoryToolbar;
