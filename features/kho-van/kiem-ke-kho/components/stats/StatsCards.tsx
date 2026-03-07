import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, FileEdit, Loader2, CheckCircle } from 'lucide-react';
import type { KiemKeKhoStatsSummary } from './useKiemKeKhoStats';

interface Props {
  summary: KiemKeKhoStatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const cards = [
    {
      title: t('kiemKeKho.stats.total'),
      value: summary.total,
      icon: ClipboardCheck,
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      title: t('kiemKeKho.trangThaiDot.draft'),
      value: summary.draft,
      icon: FileEdit,
      className: 'bg-muted text-muted-foreground border-border',
    },
    {
      title: t('kiemKeKho.trangThaiDot.dang_kiem_ke'),
      value: summary.dangKiemKe,
      icon: Loader2,
      className: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    },
    {
      title: t('kiemKeKho.trangThaiDot.hoan_thanh'),
      value: summary.hoanThanh,
      icon: CheckCircle,
      className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
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
