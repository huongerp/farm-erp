import React from 'react';
import { useTranslation } from 'react-i18next';
import GenericTable from '../../../../components/shared/GenericTable';
import { useAttendanceHistoryStore } from '../store/useAttendanceHistoryStore';
import type { AttendanceLog } from '../core/types';
interface Props {
  data: AttendanceLog[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort: { column: string | null; direction: 'asc' | 'desc' | null };
  onSort: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  onRowClick: (item: AttendanceLog) => void;
}

const AttendanceHistoryTable: React.FC<Props> = ({
  data,
  isLoading,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
  onSort,
  onRowClick,
}) => {
  const { t } = useTranslation();
  const { columns } = useAttendanceHistoryStore();

  const renderStatusBadge = (log: AttendanceLog) => {
    if (!log.check_in) {
      return <span className="text-xs text-muted-foreground">{t('attendance.history.statusMissing')}</span>;
    }
    if (log.is_late) {
      return <span className="text-xs text-amber-600">{t('attendance.history.statusLate')}</span>;
    }
    return <span className="text-xs text-emerald-600">{t('attendance.history.statusOnTime')}</span>;
  };

  const renderCell = (colId: string, item: AttendanceLog) => {
    switch (colId) {
      case 'date':
        return <span className="text-sm text-foreground">{item.date}</span>;
      case 'check_in':
        return <span className="text-sm text-foreground tabular-nums">{item.check_in ?? '--'}</span>;
      case 'check_out':
        return <span className="text-sm text-foreground tabular-nums">{item.check_out ?? '--'}</span>;
      case 'status':
        return renderStatusBadge(item);
      case 'actions':
        return null;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: AttendanceLog) => (
    <div className="bg-card rounded-xl border p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{item.date}</p>
          <p className="text-xs text-muted-foreground">
            {t('attendance.history.checkInCol')}: {item.check_in ?? '--'} · {t('attendance.history.checkOutCol')}: {item.check_out ?? '--'}
          </p>
        </div>
        {renderStatusBadge(item)}
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('attendance.history.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAll}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sort={sort}
      onSort={onSort}
      renderCell={renderCell}
      onRowClick={onRowClick}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
    />
  );
};

export default AttendanceHistoryTable;
