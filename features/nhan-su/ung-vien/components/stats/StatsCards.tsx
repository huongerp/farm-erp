import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Tag } from 'lucide-react';
import type { StatsSummary, StatsByGroup } from './useUngVienStats';

interface Props {
  summary: StatsSummary;
  byStatusList: StatsByGroup[];
}

const StatsCards: React.FC<Props> = ({ summary, byStatusList }) => {
  const { t } = useTranslation();
  const topStatuses = byStatusList.slice(0, 4);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      <div className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">
              {t('ungVien.stats.total')}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
              {summary.total}
            </p>
          </div>
        </div>
      </div>
      {topStatuses.map((s) => (
        <div
          key={s.id}
          className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-muted/80 text-muted-foreground border-border">
              <Tag size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xs text-muted-foreground truncate" title={s.ten}>
                {s.ten}
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                {s.count}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
