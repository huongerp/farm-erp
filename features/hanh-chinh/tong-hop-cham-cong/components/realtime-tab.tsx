import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Clock, Users, Download, Building2, MapPin } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useRealtimePresence } from '../../cham-cong/hooks/use-attendance';
import { useRealtimeStore } from '../store/useRealtimeStore';
import { useExportData } from '../../../../lib/useExportData';
import { RealtimePresenceRow } from '../core/types';
import { MOCK_DEPARTMENTS, MOCK_BRANCHES } from '@/mocks/he-thong';
import { TRANG_THAI } from '@/lib/constants';

const RealtimeTab: React.FC = () => {
  const { t } = useTranslation();
  const [showExport, setShowExport] = useState(false);
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
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
  } = useRealtimeStore();

  const { data: rows = [], isLoading } = useRealtimePresence();

  const counts = useMemo(() => {
    const statusCounts: Record<string, number> = { present: 0, absent: 0, checked_out: 0 };
    const deptCounts: Record<string, number> = {};
    const branchCounts: Record<string, number> = {};
    for (const r of rows) {
      if (filters.department.length === 0 || (r.department_name && filters.department.includes(r.department_name))) {
        if (filters.branch.length === 0 || (r.branch_name && filters.branch.includes(r.branch_name))) {
          statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
        }
      }
      if (filters.status.length === 0 || filters.status.includes(r.status)) {
        if (filters.branch.length === 0 || (r.branch_name && filters.branch.includes(r.branch_name))) {
          const d = r.department_name ?? '';
          if (d) deptCounts[d] = (deptCounts[d] || 0) + 1;
        }
      }
      if (filters.status.length === 0 || filters.status.includes(r.status)) {
        if (filters.department.length === 0 || (r.department_name && filters.department.includes(r.department_name))) {
          const b = r.branch_name ?? '';
          if (b) branchCounts[b] = (branchCounts[b] || 0) + 1;
        }
      }
    }
    return { statusCounts, deptCounts, branchCounts };
  }, [rows, filters.status, filters.department, filters.branch]);

  const statusOptions = useMemo(
    () => [
      { label: t('attendance.realtime.statusPresent'), value: 'present', count: counts.statusCounts['present'] ?? 0 },
      { label: t('attendance.realtime.statusAbsent'), value: 'absent', count: counts.statusCounts['absent'] ?? 0 },
      { label: t('attendance.realtime.statusCheckedOut'), value: 'checked_out', count: counts.statusCounts['checked_out'] ?? 0 },
    ],
    [t, counts.statusCounts]
  );

  const departmentOptions = useMemo(
    () => MOCK_DEPARTMENTS.map((d) => ({ label: d.ten_phong_ban, value: d.ten_phong_ban, count: counts.deptCounts[d.ten_phong_ban] ?? 0 })),
    [counts.deptCounts]
  );

  const branchOptions = useMemo(
    () => MOCK_BRANCHES.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG).map((b) => ({ label: b.ten_chi_nhanh, value: b.ten_chi_nhanh, count: counts.branchCounts[b.ten_chi_nhanh] ?? 0 })),
    [counts.branchCounts]
  );

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !term ||
        r.user_name.toLowerCase().includes(term) ||
        (r.department_name ?? '').toLowerCase().includes(term) ||
        (r.branch_name ?? '').toLowerCase().includes(term);
      const matchesStatus = filters.status.length === 0 || filters.status.includes(r.status);
      const matchesDept = filters.department.length === 0 || filters.department.includes(r.department_name ?? '');
      const matchesBranch = filters.branch.length === 0 || filters.branch.includes(r.branch_name ?? '');
      return matchesSearch && matchesStatus && matchesDept && matchesBranch;
    });
  }, [rows, searchTerm, filters.status, filters.department, filters.branch]);

  const exportMapFn = useCallback(
    (item: RealtimePresenceRow) => ({
      user_name: item.user_name,
      department_name: item.department_name ?? '--',
      branch_name: item.branch_name ?? '--',
      check_in: item.check_in ?? '--',
      status_text:
        item.status === 'present'
          ? t('attendance.realtime.statusPresent')
          : item.status === 'checked_out'
            ? t('attendance.realtime.statusCheckedOut')
            : t('attendance.realtime.statusAbsent'),
    }),
    [t]
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: filteredRows,
      isOpen: showExport,
      mapFn: exportMapFn,
      pagination,
      selectedIds,
      keyExtractor: (item) => item.user_id,
    });

  const exportColumns = useMemo(
    () => [
      { key: 'user_name', label: t('attendance.realtime.employeeCol') },
      { key: 'department_name', label: t('attendance.realtime.departmentCol') },
      { key: 'branch_name', label: t('attendance.realtime.branchCol') },
      { key: 'check_in', label: t('attendance.realtime.checkInCol') },
      { key: 'status_text', label: t('attendance.realtime.statusCol') },
    ],
    [t]
  );

  const handleExport = () => {
    if (filteredRows.length === 0) return;
    setShowExport(true);
  };

  const bulkActions =
    selectedIds.size > 0 ? (
      <button
        onClick={handleExport}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-primary/40 text-primary bg-primary/10 hover:bg-primary/15 transition-all active:scale-95 text-xs font-semibold"
      >
        <Download size={14} />
        {t('attendance.bulk.export')}
      </button>
    ) : undefined;

  const renderStatus = (row: RealtimePresenceRow) => {
    if (row.status === 'present') {
      return <span className="text-xs text-emerald-600">{t('attendance.realtime.statusPresent')}</span>;
    }
    if (row.status === 'checked_out') {
      return <span className="text-xs text-amber-600">{t('attendance.realtime.statusCheckedOut')}</span>;
    }
    return <span className="text-xs text-muted-foreground">{t('attendance.realtime.statusAbsent')}</span>;
  };

  const renderCell = (colId: string, item: RealtimePresenceRow) => {
    switch (colId) {
      case 'user_name':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Users size={14} />
            </div>
            <span className="text-sm font-medium text-foreground">{item.user_name}</span>
          </div>
        );
      case 'department_name':
        return <span className="text-sm text-foreground">{item.department_name ?? '--'}</span>;
      case 'branch_name':
        return <span className="text-sm text-foreground">{item.branch_name ?? '--'}</span>;
      case 'check_in':
        return <span className="text-sm text-foreground tabular-nums">{item.check_in ?? '--'}</span>;
      case 'status':
        return renderStatus(item);
      case 'actions':
        return null;
      default:
        return null;
    }
  };

  const renderFilters = (
    <>
      <FilterChipMultiSelect
        options={statusOptions}
        value={filters.status}
        onChange={(val) => setFilter('status', val)}
        placeholder={t('attendance.realtime.statusCol')}
        icon={Clock}
        className="w-full sm:w-[180px]"
      />
      <FilterChipMultiSelect
        options={departmentOptions}
        value={filters.department}
        onChange={(val) => setFilter('department', val)}
        placeholder={t('attendance.realtime.departmentCol')}
        icon={Building2}
        className="w-full sm:w-[200px]"
      />
      <FilterChipMultiSelect
        options={branchOptions}
        value={filters.branch}
        onChange={(val) => setFilter('branch', val)}
        placeholder={t('attendance.realtime.branchCol')}
        icon={MapPin}
        className="w-full sm:w-[200px]"
      />
    </>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <GenericToolbar
        selectedCount={selectedIds.size}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSelection={clearSelection}
        filters={renderFilters}
        bulkActions={bulkActions}
        actions={
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground transition-all active:scale-95 text-xs font-medium"
          >
            <Download size={14} />
            {t('attendance.bulk.export')}
          </button>
        }
        searchPlaceholder={t('attendance.realtime.searchPlaceholder')}
        activeFilterCount={filters.status.length + filters.department.length + filters.branch.length}
        onClearAllFilters={() => {
          setFilter('status', []);
          setFilter('department', []);
          setFilter('branch', []);
        }}
        columns={columns}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetColumns={resetColumns}
        showBack
      />
      <div className="flex-1 min-h-0">
        <GenericTable
          data={filteredRows}
          columns={columns}
          isLoading={isLoading}
          loadingText={t('attendance.realtime.loading')}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
          renderCell={renderCell}
          renderMobileCard={(item) => (
            <div className="bg-card rounded-xl border p-3.5 shadow-sm">
              <p className="text-sm font-semibold text-foreground">{item.user_name}</p>
              <p className="text-xs text-muted-foreground">{item.department_name ?? '--'}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {t('attendance.realtime.checkInCol')}: {item.check_in ?? '--'} · {renderStatus(item)}
              </div>
            </div>
          )}
          keyExtractor={(item) => item.user_id}
        />
      </div>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName="Theo_Doi_Thoi_Gian_Thuc"
            visibleColumnKeys={['user_name', 'department_name', 'branch_name', 'check_in', 'status_text']}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealtimeTab;
