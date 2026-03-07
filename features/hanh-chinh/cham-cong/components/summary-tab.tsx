import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, AlarmClock } from 'lucide-react';
import { useAuthStore } from '../../../../store/useStore';
import { useMySummary } from '../hooks/use-attendance';

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const AttendanceSummaryTab: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'emp-000';
  const [month, setMonth] = React.useState('');

  useEffect(() => {
    if (!month) {
      const now = new Date();
      const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setMonth(m);
    }
  }, [month]);

  const { data } = useMySummary(userId, month || '');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card shadow-sm p-4 flex items-center gap-3">
        <Calendar size={18} className="text-muted-foreground" />
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard
          title={t('attendance.summary.totalDays')}
          value={String(data?.total_days ?? 0)}
          icon={<Calendar size={18} />}
        />
        <SummaryCard
          title={t('attendance.summary.totalHours')}
          value={`${data?.total_hours ?? 0}h`}
          icon={<Clock size={18} />}
        />
        <SummaryCard
          title={t('attendance.summary.lateCount')}
          value={String(data?.late_count ?? 0)}
          icon={<AlarmClock size={18} />}
        />
      </div>
    </div>
  );
};

export default AttendanceSummaryTab;
