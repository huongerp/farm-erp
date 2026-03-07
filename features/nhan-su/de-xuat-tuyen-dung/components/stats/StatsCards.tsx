import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Briefcase } from 'lucide-react';
import type { StatsSummary } from './useDeXuatTuyenDungStats';

const STATUS_KEYS: Record<number, string> = {
  0: 'deXuatTuyenDung.status.nhap',
  1: 'deXuatTuyenDung.status.choDuyet',
  2: 'deXuatTuyenDung.status.daDuyet',
  3: 'deXuatTuyenDung.status.tuChoi',
};

const STATUS_CARD_CLASS: Record<number, string> = {
  0: 'bg-muted/80 text-muted-foreground border-border',
  1: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  2: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  3: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

interface Props {
  summary: StatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      <div className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">
              {t('deXuatTuyenDung.stats.total')}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
              {summary.total}
            </p>
          </div>
        </div>
      </div>
      {([0, 1, 2, 3] as const).map((status) => (
        <div
          key={status}
          className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${STATUS_CARD_CLASS[status]}`}
            >
              <Briefcase size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xs text-muted-foreground truncate">
                {t(STATUS_KEYS[status])}
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {summary.byStatus[status]}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
