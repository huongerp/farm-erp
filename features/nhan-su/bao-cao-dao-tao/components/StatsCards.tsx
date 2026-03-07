import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, BookOpen } from 'lucide-react';
import type { BaoCaoDaoTaoSummary } from '../hooks/useBaoCaoDaoTaoStats';

interface Props {
  summary: BaoCaoDaoTaoSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const cards = [
    {
      title: t('baoCaoDaoTao.cardTongDangKy'),
      value: summary.tongDangKy,
      icon: ClipboardList,
      className: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
    },
    {
      title: t('baoCaoDaoTao.cardDangHoc'),
      value: summary.dangHoc,
      icon: BookOpen,
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    },
    {
      title: t('baoCaoDaoTao.cardHoanThanh'),
      value: summary.hoanThanh,
      icon: ClipboardList,
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    },
    {
      title: t('baoCaoDaoTao.cardTyLeHoanThanh'),
      value: `${summary.tyLeHoanThanh.toFixed(1)}%`,
      icon: ClipboardList,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
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
