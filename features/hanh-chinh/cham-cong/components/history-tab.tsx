import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import AttendanceHistoryToolbar from './attendance-history-toolbar';
import AttendanceHistoryTable from './attendance-history-table';
import AttendanceLogDetail from './attendance-log-detail';
import AttendanceLogForm from './attendance-log-form';
import ExportDialog from '../../../../components/shared/ExportDialog';
import { useAttendanceHistoryStore } from '../store/useAttendanceHistoryStore';
import { useMyAttendanceHistory, useUpdateAttendanceLog } from '../hooks/use-attendance';
import { useAuthStore } from '../../../../store/useStore';
import { useListWithFilter } from '../../../../lib/hooks';
import { useExportData } from '../../../../lib/useExportData';
import type { AttendanceLog } from '../core/types';
import type { AttendanceHistoryFilters } from '../store/useAttendanceHistoryStore';

const AttendanceHistoryTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'emp-000';

  const [showExport, setShowExport] = useState(false);
  const [viewingLog, setViewingLog] = useState<AttendanceLog | null>(null);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);

  const updateMutation = useUpdateAttendanceLog();
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
  } = useAttendanceHistoryStore();

  const monthKey = useMemo(
    () => filters.month || (() => {
      const n = new Date();
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    })(),
    [filters.month]
  );

  useEffect(() => {
    if (!filters.month) {
      const n = new Date();
      const month = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
      setFilter('month', month);
    }
  }, [filters.month, setFilter]);

  useEffect(() => () => resetState(), [resetState]);

  const { data: logs = [], isLoading } = useMyAttendanceHistory(userId, monthKey);

  const filterFn = useCallback(
    (item: AttendanceLog, term: string, f: AttendanceHistoryFilters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.date.includes(term) ||
        (item.check_in ?? '').includes(term) ||
        (item.check_out ?? '').includes(term) ||
        (item.branch_name ?? '').toLowerCase().includes(searchLower);
      const status = !item.check_in ? 'missing' : item.is_late ? 'late' : 'on_time';
      const matchesStatus = f.status.length === 0 || f.status.includes(status);
      const matchesBranch = f.branch.length === 0 || f.branch.includes(item.branch_name ?? '');
      return matchesSearch && matchesStatus && matchesBranch;
    },
    []
  );

  const filteredLogs = useListWithFilter(logs, searchTerm, filters, filterFn);

  const exportColumns = useMemo(
    () => [
      { key: 'date', label: t('attendance.history.dateCol') },
      { key: 'check_in', label: t('attendance.history.checkInCol') },
      { key: 'check_out', label: t('attendance.history.checkOutCol') },
      { key: 'status_text', label: t('attendance.history.statusCol') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: AttendanceLog) => ({
      date: item.date,
      check_in: item.check_in ?? '--',
      check_out: item.check_out ?? '--',
      status_text: !item.check_in
        ? t('attendance.history.statusMissing')
        : item.is_late
          ? t('attendance.history.statusLate')
          : t('attendance.history.statusOnTime'),
    }),
    [t]
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } = useExportData({
    data: filteredLogs,
    isOpen: showExport,
    mapFn: exportMapFn,
    pagination,
    selectedIds,
    keyExtractor: (item) => item.id,
  });

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    setShowExport(true);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <AttendanceHistoryToolbar items={logs} onExport={handleExport} />

      <div className="flex-1 min-h-0">
        <AttendanceHistoryTable
          data={filteredLogs}
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
          onRowClick={(item) => setViewingLog(item)}
        />
      </div>

      {viewingLog && !editingLog && (
        <AttendanceLogDetail
          data={viewingLog}
          onClose={() => setViewingLog(null)}
          onEdit={(item) => {
            setViewingLog(null);
            setEditingLog(item);
          }}
        />
      )}

      {editingLog && (
        <AttendanceLogForm
          data={editingLog}
          onClose={() => setEditingLog(null)}
          onSuccess={() => {
            setEditingLog(null);
            setViewingLog(null);
          }}
          updateMutation={updateMutation}
        />
      )}

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName="Lich_Su_Cham_Cong"
            visibleColumnKeys={['date', 'check_in', 'check_out', 'status_text']}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceHistoryTab;
