import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import EmployeeAttendanceToolbar from './employee-attendance-toolbar';
import EmployeeAttendanceTable from './employee-attendance-table';
import AttendanceDetailModal from './attendance-detail-modal';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useEmployeeAttendance, useConfirmAttendance } from '../../cham-cong/hooks/use-attendance';
import { useEmployeeAttendanceStore } from '../store/useEmployeeAttendanceStore';
import { useExportData } from '../../../../lib/useExportData';
import { useListWithFilter } from '../../../../lib/hooks';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { EmployeeAttendanceRow } from '../core/types';
import type { EmployeeAttendanceFilters } from '../store/useEmployeeAttendanceStore';

const EmployeeAttendanceTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);

  const [showExport, setShowExport] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<EmployeeAttendanceRow | null>(null);

  const {
    searchTerm,
    filters,
    setFilter,
    columns,
    selectedIds,
    clearSelection,
    toggleSelection,
    toggleAllSelection,
    pagination,
    setPage,
    setPageSize,
    sort,
    setSort,
    resetState,
  } = useEmployeeAttendanceStore();

  useEffect(() => {
    if (!filters.month) {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setFilter('month', month);
    }
  }, [filters.month, setFilter]);

  useEffect(() => () => resetState(), [resetState]);

  const { data: rows = [], isLoading } = useEmployeeAttendance(filters.month || '');
  const confirmMutation = useConfirmAttendance();

  const filterFn = useCallback(
    (r: EmployeeAttendanceRow, term: string, f: EmployeeAttendanceFilters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        r.user_name.toLowerCase().includes(searchLower) ||
        (r.department_name ?? '').toLowerCase().includes(searchLower) ||
        (r.branch_name ?? '').toLowerCase().includes(searchLower);
      const matchesDept =
        f.department.length === 0 || f.department.includes(r.department_name ?? '');
      const matchesBranch =
        f.branch.length === 0 || f.branch.includes(r.branch_name ?? '');
      return matchesSearch && matchesDept && matchesBranch;
    },
    []
  );

  const filteredRows = useListWithFilter(rows, searchTerm, filters, filterFn);

  const exportMapFn = useCallback(
    (item: EmployeeAttendanceRow) => ({
      user_name: item.user_name,
      department_name: item.department_name ?? '--',
      branch_name: item.branch_name ?? '--',
      total_days: item.total_days,
      total_hours: item.total_hours,
      late_count: item.late_count,
    }),
    []
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: filteredRows,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.user_id,
  });

  const exportColumns = useMemo(
    () => [
      { key: 'user_name', label: t('attendance.management.employeeCol') },
      { key: 'department_name', label: t('attendance.management.departmentCol') },
      { key: 'branch_name', label: t('attendance.management.branchCol') },
      { key: 'total_days', label: t('attendance.management.daysCol') },
      { key: 'total_hours', label: t('attendance.management.hoursCol') },
      { key: 'late_count', label: t('attendance.management.lateCol') },
    ],
    [t]
  );

  const handleExport = () => {
    if (filteredRows.length === 0) return;
    setShowExport(true);
  };

  const handleConfirmMany = (ids: string[]) => {
    confirm({
      title: t('attendance.bulk.confirm'),
      message: t('attendance.bulk.confirmMessage', { count: ids.length }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        confirmMutation.mutate(
          { userIds: ids, monthKey: filters.month || '' },
          { onSuccess: () => clearSelection() }
        );
      },
    });
  };

  const handleConfirmOne = (userId: string) => {
    confirmMutation.mutate(
      { userIds: [userId], monthKey: filters.month || '' },
      { onSuccess: () => setViewingEmployee(null) }
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <EmployeeAttendanceToolbar
        items={rows}
        onExport={handleExport}
        onConfirmMany={handleConfirmMany}
        isConfirming={confirmMutation.isPending}
      />

      <div className="flex-1 min-h-0">
        <EmployeeAttendanceTable
          data={filteredRows}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAllSelection}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
          onRowClick={(item) => setViewingEmployee(item)}
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
            fileName="Bang_Cong_Nhan_Vien"
            visibleColumnKeys={['user_name', 'department_name', 'branch_name', 'total_days', 'total_hours', 'late_count']}
          />
        )}
      </AnimatePresence>

      {viewingEmployee && (
        <AttendanceDetailModal
          employee={viewingEmployee}
          monthKey={filters.month || ''}
          onClose={() => setViewingEmployee(null)}
          onConfirm={handleConfirmOne}
          isConfirming={confirmMutation.isPending}
        />
      )}
    </div>
  );
};

export default EmployeeAttendanceTab;
