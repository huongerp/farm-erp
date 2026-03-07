import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Wifi, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { useAuthStore } from '../../../../store/useStore';
import { useCheckIn, useCheckOut, useTodayAttendance } from '../hooks/use-attendance';

const AttendanceTodayTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'emp-000';
  const { data, isLoading } = useTodayAttendance(userId);
  const checkInMutation = useCheckIn(userId);
  const checkOutMutation = useCheckOut(userId);
  const [showLate, setShowLate] = useState(false);

  const actionState = useMemo(() => {
    if (!data) return { label: t('attendance.today.checkIn'), mode: 'checkin' as const };
    if (data.can_check_in) return { label: t('attendance.today.checkIn'), mode: 'checkin' as const };
    if (data.can_check_out) return { label: t('attendance.today.checkOut'), mode: 'checkout' as const };
    return { label: t('attendance.today.waiting'), mode: 'none' as const };
  }, [data, t]);

  const handleAction = async () => {
    if (actionState.mode === 'checkin') {
      const result = await checkInMutation.mutateAsync();
      if (result.is_late) setShowLate(true);
    }
    if (actionState.mode === 'checkout') {
      await checkOutMutation.mutateAsync();
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{t('attendance.today.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('attendance.today.subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">{t('attendance.today.currentIp')}</p>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium">
              <Wifi size={14} className="text-primary" />
              {data?.current_ip ?? '--'}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">{t('attendance.today.checkInTime')}</p>
            <div className="mt-1 text-sm font-semibold text-foreground">{data?.check_in ?? '--'}</div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">{t('attendance.today.checkOutTime')}</p>
            <div className="mt-1 text-sm font-semibold text-foreground">{data?.check_out ?? '--'}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleAction}
            disabled={actionState.mode === 'none'}
            isLoading={checkInMutation.isPending || checkOutMutation.isPending || isLoading}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {actionState.mode === 'checkin' ? <LogIn size={16} className="mr-2" /> : <LogOut size={16} className="mr-2" />}
            {actionState.label}
          </Button>
          {data?.is_late && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              {t('attendance.today.lateBadge')}
            </span>
          )}
        </div>
      </div>

      {showLate && data?.check_in && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{t('attendance.today.lateTitle')}</p>
            <p className="text-sm text-amber-700">
              {t('attendance.today.lateMessage', { time: data.check_in })}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-amber-200 text-amber-700 hover:bg-amber-100"
              onClick={() => setShowLate(false)}
            >
              {t('attendance.today.lateClose')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTodayTab;
