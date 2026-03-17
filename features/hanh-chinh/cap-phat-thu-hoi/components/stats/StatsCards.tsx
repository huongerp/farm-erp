import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Calendar, CalendarDays, CalendarRange, ArrowDownCircle, ArrowUpCircle, Repeat } from 'lucide-react';
import type { PhieuStatsSummary } from './usePhieuStats';

interface Props {
  summary: PhieuStatsSummary;
}

const cardClass = 'bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm';
const cardHighlightClass = 'bg-card rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 transition-all hover:shadow-sm';
const iconWrapClass = 'w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0';
const iconClass = 'text-primary';

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <div className={iconWrapClass}>
            <Package size={15} className={iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">{t('capPhatThuHoi.stats.total')}</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.total}</p>
          </div>
        </div>
      </div>
      <div className={cardHighlightClass}>
        <div className="flex items-center gap-2.5">
          <div className={iconWrapClass}>
            <Calendar size={15} className={iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-primary truncate">{t('capPhatThuHoi.stats.thisMonth')}</p>
            <p className="text-lg font-bold text-primary tabular-nums mt-0.5">{summary.countThisMonth}</p>
          </div>
        </div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <div className={iconWrapClass}>
            <CalendarDays size={15} className={iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">{t('capPhatThuHoi.stats.today')}</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.countToday}</p>
          </div>
        </div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <div className={iconWrapClass}>
            <CalendarRange size={15} className={iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">{t('capPhatThuHoi.stats.thisWeek')}</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.countThisWeek}</p>
          </div>
        </div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <div className={iconWrapClass}>
            <ArrowDownCircle size={15} className={iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">{t('capPhatThuHoi.stats.capPhat')}</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.countCapPhat}</p>
          </div>
        </div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <div className={iconWrapClass}>
            <ArrowUpCircle size={15} className={iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">{t('capPhatThuHoi.stats.thuHoi')}</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.countThuHoi}</p>
          </div>
        </div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center gap-2.5">
          <div className={iconWrapClass}>
            <Repeat size={15} className={iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">{t('capPhatThuHoi.stats.luanChuyen')}</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{summary.countLuanChuyen}</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default StatsCards;
