import React from 'react';
import { useTranslation } from 'react-i18next';
import GenericTable from '../../../../components/shared/GenericTable';
import { useEmployeeAttendanceStore } from '../store/useEmployeeAttendanceStore';
import type { EmployeeAttendanceRow } from '../core/types';

interface Props {
  data: EmployeeAttendanceRow[];
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
  onRowClick: (item: EmployeeAttendanceRow) => void;
}

const EmployeeAttendanceTable: React.FC<Props> = ({
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
  const { columns } = useEmployeeAttendanceStore();

  const renderCell = (colId: string, item: EmployeeAttendanceRow) => {
    switch (colId) {
      case 'user_name':
        return <span className="text-sm font-medium text-foreground">{item.user_name}</span>;
      case 'department_name':
        return <span className="text-sm text-foreground">{item.department_name ?? '--'}</span>;
      case 'branch_name':
        return <span className="text-sm text-foreground">{item.branch_name ?? '--'}</span>;
      case 'total_days':
        return <span className="text-sm text-foreground tabular-nums">{item.total_days}</span>;
      case 'total_hours':
        return <span className="text-sm text-foreground tabular-nums">{item.total_hours}</span>;
      case 'late_count':
        return <span className="text-sm text-foreground tabular-nums">{item.late_count}</span>;
      case 'actions':
        return null;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: EmployeeAttendanceRow) => (
    <div className="bg-card rounded-xl border p-3.5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">{item.user_name}</p>
      <p className="text-xs text-muted-foreground">{item.department_name ?? '--'}</p>
      <div className="mt-2 text-xs text-muted-foreground">
        {item.branch_name ?? '--'} · {t('attendance.management.daysCol')}: {item.total_days} · {t('attendance.management.hoursCol')}: {item.total_hours} · {t('attendance.management.lateCol')}: {item.late_count}
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('attendance.management.loading')}
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
      keyExtractor={(item) => item.user_id}
    />
  );
};

export default EmployeeAttendanceTable;
