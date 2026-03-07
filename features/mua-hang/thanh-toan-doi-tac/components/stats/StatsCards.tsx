import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, CheckCircle, XCircle, Banknote, MoreHorizontal } from 'lucide-react';
import type { ThanhToanDoiTacStatsSummary } from './useThanhToanDoiTacStats';

function formatVnd(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

interface Props {
  summary: ThanhToanDoiTacStatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const cards = [
    { title: t('thanhToanDoiTac.stats.total'), value: summary.total, icon: FileText, className: 'bg-primary/10 text-primary border-primary/20' },
    { title: t('thanhToanDoiTac.stats.totalAmount'), value: formatVnd(summary.totalAmount), icon: Banknote, className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
    { title: t('thanhToanDoiTac.stats.pending'), value: summary.pending, icon: Clock, className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
    { title: t('thanhToanDoiTac.stats.paid'), value: summary.paid, icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
    { title: t('thanhToanDoiTac.stats.cancelled'), value: summary.cancelled, icon: XCircle, className: 'bg-rose-500/10 text-rose-700 border-rose-500/20' },
    { title: t('thanhToanDoiTac.stats.other'), value: summary.other, icon: MoreHorizontal, className: 'bg-slate-500/10 text-slate-700 border-slate-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {cards.map((card) => (
        <div key={card.title} className={`rounded-lg border p-2.5 sm:p-3 transition-all hover:shadow-sm flex items-center gap-2.5 ${card.className}`}>
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
