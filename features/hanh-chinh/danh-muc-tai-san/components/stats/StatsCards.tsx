import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Tag } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/utils';
import type { StatsSummary } from './useTaiSanStats';

interface Props {
  summary: StatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
            <Building2 size={15} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">
              {t('danhSachTaiSan.stats.total')}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
              {summary.total}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 transition-all hover:shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Tag size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-primary truncate">
              {t('danhSachTaiSan.stats.active')}
            </p>
            <p className="text-lg font-bold text-primary tabular-nums mt-0.5">
              {summary.activeCount}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
            <Tag size={15} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">
              {t('danhSachTaiSan.stats.inactive')}
            </p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
              {summary.inactiveCount}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-emerald-200 dark:border-emerald-800 p-2.5 sm:p-3 transition-all hover:shadow-sm col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
            <Building2 size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-emerald-700 dark:text-emerald-400 truncate">
              {t('danhSachTaiSan.stats.totalValue')}
            </p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5 truncate">
              {formatCurrency(summary.totalNguyenGia)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
