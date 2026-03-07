import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Building2, Download, CheckCircle2, MapPin } from 'lucide-react';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import { useEmployeeAttendanceStore } from '../store/useEmployeeAttendanceStore';
import { useDepartments } from '../../../he-thong/phong-ban/hooks/use-phong-ban';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import type { EmployeeAttendanceRow } from '../core/types';

interface Props {
  /** Danh sách dòng chấm công để đếm count theo phòng/chi nhánh. */
  items?: EmployeeAttendanceRow[];
  onExport: () => void;
  onConfirmMany: (ids: string[]) => void;
  isConfirming: boolean;
}

const EmployeeAttendanceToolbar: React.FC<Props> = ({
  items = [],
  onExport,
  onConfirmMany,
  isConfirming,
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
    selectedIds,
  } = useEmployeeAttendanceStore();

  const { data: departments = [] } = useDepartments();
  const { data: branches = [] } = useBranches();

  const counts = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    const branchCounts: Record<string, number> = {};
    for (const r of items) {
      if (filters.branch.length === 0 || (r.branch_name && filters.branch.includes(r.branch_name))) {
        const key = r.department_name ?? '';
        if (key) deptCounts[key] = (deptCounts[key] || 0) + 1;
      }
      if (filters.department.length === 0 || (r.department_name && filters.department.includes(r.department_name))) {
        const key = r.branch_name ?? '';
        if (key) branchCounts[key] = (branchCounts[key] || 0) + 1;
      }
    }
    return { deptCounts, branchCounts };
  }, [items, filters.department, filters.branch]);

  const departmentOptions = useMemo(
    () =>
      departments
        .filter((d) => d.id_cha === null)
        .map((d) => ({ label: d.ten_phong_ban, value: d.ten_phong_ban, count: counts.deptCounts[d.ten_phong_ban] ?? 0 })),
    [departments, counts.deptCounts]
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
      filters.department.length +
      filters.branch.length +
      (filters.month ? 1 : 0),
    [searchTerm, filters]
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('department', []);
    setFilter('branch', []);
    setFilter('month', '');
  };

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={departmentOptions}
        value={filters.department}
        onChange={(val) => setFilter('department', val)}
        placeholder={t('attendance.management.departmentCol')}
        icon={Building2}
        className="w-full sm:w-[200px]"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.branch}
        onChange={(val) => setFilter('branch', val)}
        placeholder={t('attendance.management.branchCol')}
        icon={MapPin}
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
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-primary/40 text-primary bg-primary/10 hover:bg-primary/15 transition-all active:scale-95 text-xs font-semibold"
        >
          <Download size={14} />
          {t('attendance.bulk.export')}
        </button>
        <button
          onClick={() => onConfirmMany(Array.from(selectedIds))}
          disabled={isConfirming}
          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95 text-xs font-semibold disabled:opacity-60"
        >
          <CheckCircle2 size={14} />
          {t('attendance.bulk.confirm')}
        </button>
      </div>
    ) : undefined;

  const filterGroups = useMemo(
    () => [
      {
        key: 'department',
        label: t('attendance.management.departmentCol'),
        icon: Building2,
        options: departmentOptions,
        value: filters.department,
        onChange: (val: string[]) => setFilter('department', val),
      },
      {
        key: 'branch',
        label: t('attendance.management.branchCol'),
        icon: MapPin,
        options: branchOptions,
        value: filters.branch,
        onChange: (val: string[]) => setFilter('branch', val),
      },
    ],
    [departmentOptions, branchOptions, filters.department, filters.branch, setFilter, t]
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
      searchPlaceholder={t('attendance.management.searchPlaceholder')}
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

export default EmployeeAttendanceToolbar;
