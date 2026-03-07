import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingDown, Calculator } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/utils';
import type { KhauHaoStatsSummary } from './useKhauHaoStats';

interface Props {
  summary: KhauHaoStatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <div className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
            <Wallet size={15} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-muted-foreground truncate">
              {t('khauHaoTaiSan.stats.tongNguyenGia')}
            </p>
            <p className="text-sm font-bold text-foreground tabular-nums mt-0.5 truncate">
              {formatCurrency(summary.tongNguyenGia)}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-amber-200 dark:border-amber-800 p-2.5 sm:p-3 transition-all hover:shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <TrendingDown size={15} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-amber-700 dark:text-amber-400 truncate">
              {t('khauHaoTaiSan.stats.tongKhauHaoLuyKe')}
            </p>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums mt-0.5 truncate">
              {formatCurrency(summary.tongKhauHaoLuyKe)}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-emerald-200 dark:border-emerald-800 p-2.5 sm:p-3 transition-all hover:shadow-sm col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
            <Calculator size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-emerald-700 dark:text-emerald-400 truncate">
              {t('khauHaoTaiSan.stats.tongGiaTriConLai')}
            </p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5 truncate">
              {formatCurrency(summary.tongGiaTriConLai)}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 transition-all hover:shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-primary truncate">
              {t('khauHaoTaiSan.stats.totalCount')}
            </p>
            <p className="text-lg font-bold text-primary tabular-nums mt-0.5">
              {summary.totalCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
