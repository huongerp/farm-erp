import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, CheckCircle, XCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/utils';
import type { DeXuatChiPhiStatsSummary } from './useDeXuatChiPhiStats';

interface Props {
  summary: DeXuatChiPhiStatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const cards = [
    {
      title: t('deXuatChiPhi.stats.total'),
      value: summary.total,
      icon: FileText,
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      title: t('deXuatChiPhi.status.pending'),
      value: summary.pending,
      icon: Clock,
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: t('deXuatChiPhi.status.approved'),
      value: summary.approved,
      icon: CheckCircle,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: t('deXuatChiPhi.status.rejected'),
      value: summary.rejected,
      icon: XCircle,
      className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    },
    {
      title: t('deXuatChiPhi.stats.thuCount'),
      value: summary.thuCount,
      sub: formatCurrency(summary.tongTienThu),
      icon: ArrowDownCircle,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: t('deXuatChiPhi.stats.chiCount'),
      value: summary.chiCount,
      sub: formatCurrency(summary.tongTienChi),
      icon: ArrowUpCircle,
      className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-lg border p-2.5 sm:p-3 transition-all hover:shadow-sm flex items-center gap-2.5 ${card.className}`}
        >
          <div className="w-8 h-8 rounded-lg bg-white/50 dark:bg-black/10 flex items-center justify-center shrink-0">
            <card.icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs opacity-90 truncate">{card.title}</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{card.value}</p>
            {'sub' in card && card.sub && (
              <p className="text-xs opacity-90 tabular-nums mt-0.5 truncate">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
