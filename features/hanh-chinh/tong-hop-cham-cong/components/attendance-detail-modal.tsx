import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Calendar, CheckCircle2, Pencil, Plus, Trash2, Receipt } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { useEmployeeAttendanceLogs, useUpdateAttendanceLog, useDeleteAttendanceLog, useAddAttendanceLog } from '../../cham-cong/hooks/use-attendance';
import { useAdminFormsByUserMonth } from '../../phieu-hanh-chinh/hooks/use-admin-form';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { getAdminFormShiftLabel, getAdminFormStatusLabel } from '../../phieu-hanh-chinh/core/constants';
import AttendanceLogForm from '../../cham-cong/components/attendance-log-form';
import AttendanceLogAddForm from '../../cham-cong/components/attendance-log-add-form';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import type { EmployeeAttendanceRow } from '../core/types';
import type { AttendanceLog } from '../../cham-cong/core/types';
import type { AdminFormRequest } from '../../phieu-hanh-chinh/core/types';

interface Props {
  employee: EmployeeAttendanceRow | null;
  monthKey: string;
  onClose: () => void;
  onConfirm: (userId: string) => void;
  isConfirming?: boolean;
}

const AttendanceDetailModal: React.FC<Props> = ({
  employee,
  monthKey,
  onClose,
  onConfirm,
  isConfirming = false,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const updateMutation = useUpdateAttendanceLog();
  const deleteMutation = useDeleteAttendanceLog();
  const addMutation = useAddAttendanceLog();
  const { data: logs = [], isLoading } = useEmployeeAttendanceLogs(
    employee?.user_id ?? '',
    monthKey,
    !!employee
  );

  const { data: adminForms = [], isLoading: adminFormsLoading } = useAdminFormsByUserMonth(
    employee?.user_id ?? '',
    monthKey,
    !!employee
  );

  const logByDate = useMemo(() => {
    const m = new Map<string, AttendanceLog>();
    logs.forEach((l) => m.set(l.date, l));
    return m;
  }, [logs]);

  const getFormLinkedInfo = (form: AdminFormRequest): string | null => {
    const log = logByDate.get(form.ngay);
    if (!log) {
      if (form.loai_phieu === 'leave_paid' || form.loai_phieu === 'leave_unpaid') return t('attendance.history.statusMissing');
      if (form.loai_phieu === 'business_trip') return t('payrollIp.groups.types.businessTrip');
      return null;
    }
    if (form.loai_phieu === 'late_early' && log.is_late) return t('attendance.history.statusLate');
    if (form.loai_phieu === 'missed_checkin' && !log.check_in) return t('payrollIp.groups.types.missedCheckin');
    if (form.loai_phieu === 'overtime') return t('payrollIp.groups.types.overtime');
    return null;
  };

  const renderStatusBadge = (log: AttendanceLog) => {
    if (!log.check_in) {
      return <span className="text-xs text-muted-foreground">{t('attendance.history.statusMissing')}</span>;
    }
    if (log.is_late) {
      return <span className="text-xs text-amber-600">{t('attendance.history.statusLate')}</span>;
    }
    return <span className="text-xs text-emerald-600">{t('attendance.history.statusOnTime')}</span>;
  };

  if (!employee) return null;

  const handleDeleteLog = (log: AttendanceLog) => {
    confirm({
      title: t('common.delete'),
      message: t('attendance.form.deleteConfirm', { date: log.date }),
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: () =>
        deleteMutation.mutate(log.id, {
          onSuccess: () => {},
        }),
    });
  };

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('attendance.form.addTitle'),
      icon: <Plus size={16} />,
      onClick: () => setShowAddForm(true),
      variant: 'primary',
      disabled: addMutation.isPending,
    },
    {
      label: t('attendance.detail.confirmButton'),
      icon: <CheckCircle2 size={16} />,
      onClick: () => onConfirm(employee.user_id),
      variant: 'success',
      disabled: isConfirming,
    },
  ];

  return (
    <>
    <GenericDrawer
        title={t('attendance.detail.title')}
        subtitle={`${employee.user_name} · ${monthKey}`}
        icon={<Calendar size={20} />}
        onClose={onClose}
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User size={18} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{employee.user_name}</p>
              <p className="text-sm text-muted-foreground">{employee.department_name ?? '--'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('attendance.detail.summary')}: {employee.total_days} {t('attendance.detail.days')} · {employee.total_hours}h · {employee.late_count} {t('attendance.history.statusLate')}
              </p>
            </div>
          </div>

          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">{t('attendance.detail.dailyLogs')}</h4>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t('attendance.history.loading')}</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 border-b border-border">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('attendance.history.dateCol')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('attendance.history.checkInCol')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('attendance.history.checkOutCol')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('attendance.history.statusCol')}</th>
                      <th className="text-right py-2.5 px-3 font-medium text-foreground w-24">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                        <td className="py-2 px-3 text-foreground">{log.date}</td>
                        <td className="py-2 px-3 tabular-nums text-foreground">{log.check_in ?? '--'}</td>
                        <td className="py-2 px-3 tabular-nums text-foreground">{log.check_out ?? '--'}</td>
                        <td className="py-2 px-3">{renderStatusBadge(log)}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip content={t('common.edit')} placement="left">
                              <button
                                type="button"
                                onClick={() => setEditingLog(log)}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                aria-label={t('common.edit')}
                              >
                                <Pencil size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip content={t('common.delete')} placement="left">
                              <button
                                type="button"
                                onClick={() => handleDeleteLog(log)}
                                disabled={deleteMutation.isPending}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-50"
                                aria-label={t('common.delete')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Receipt size={16} className="text-primary" />
              {t('attendance.detail.adminFormsSection')}
            </h4>
            {adminFormsLoading ? (
              <p className="text-sm text-muted-foreground">{t('attendance.detail.adminFormsLoading')}</p>
            ) : adminForms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">{t('attendance.detail.adminFormsEmpty')}</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden max-h-[240px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 border-b border-border">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('adminForm.store.dateCol')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('adminForm.store.typeCol')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('adminForm.form.reason')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('adminForm.store.shiftCol')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground">{t('adminForm.store.statusCol')}</th>
                      <th className="text-left py-2.5 px-3 font-medium text-foreground w-28">{t('attendance.detail.adminFormLinked')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminForms.map((form) => {
                      const linked = getFormLinkedInfo(form);
                      return (
                        <tr key={form.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="py-2 px-3 text-foreground">{form.ngay}</td>
                          <td className="py-2 px-3 text-foreground">{getAdminFormTypeLabel(form.loai_phieu, t)}</td>
                          <td className="py-2 px-3 text-foreground line-clamp-1 max-w-[160px]" title={form.ly_do}>{form.ly_do}</td>
                          <td className="py-2 px-3 text-foreground">{getAdminFormShiftLabel(form.ca, t)}</td>
                          <td className="py-2 px-3">
                            <span
                              className={form.trang_thai === 'approved' ? 'text-xs text-emerald-600' : form.trang_thai === 'rejected' || form.trang_thai === 'cancelled' ? 'text-xs text-rose-600' : 'text-xs text-amber-600'}
                            >
                              {getAdminFormStatusLabel(form.trang_thai, t)}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {linked ? (
                              <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{linked}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </GenericDrawer>

      {editingLog && (
        <AttendanceLogForm
          data={editingLog}
          onClose={() => setEditingLog(null)}
          onSuccess={() => setEditingLog(null)}
          updateMutation={updateMutation}
        />
      )}

      {showAddForm && employee && (
        <AttendanceLogAddForm
          userId={employee.user_id}
          user_name={employee.user_name}
          monthKey={monthKey}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => setShowAddForm(false)}
          addMutation={addMutation}
        />
      )}
    </>
  );
};

export default AttendanceDetailModal;
