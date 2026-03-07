import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { PhieuDeXuatVatTuStatsSummary } from './usePhieuDeXuatVatTuStats';

interface Props {
  summary: PhieuDeXuatVatTuStatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const cards = [
    {
      title: t('phieuDeXuatVatTu.stats.total'),
      value: summary.total,
      icon: FileText,
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      title: t('phieuDeXuatVatTu.status.pending'),
      value: summary.pending,
      icon: Clock,
      className: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    },
    {
      title: t('phieuDeXuatVatTu.status.approved'),
      value: summary.approved,
      icon: CheckCircle,
      className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    },
    {
      title: t('phieuDeXuatVatTu.status.rejected'),
      value: summary.rejected,
      icon: XCircle,
      className: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
