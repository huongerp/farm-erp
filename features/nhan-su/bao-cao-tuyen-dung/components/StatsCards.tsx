import React from 'react';
import { useTranslation } from 'react-i18next';
import { Send, UserPlus, CalendarCheck, Mail, FileSignature, FileCheck } from 'lucide-react';
import type { FunnelSummary } from '../hooks/useBaoCaoTuyenDungStats';

interface Props {
  summary: FunnelSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const cards = [
    {
      title: t('baoCaoTuyenDung.cardDeXuat'),
      value: summary.deXuatDaDuyet,
      icon: Send,
      className: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
    },
    {
      title: t('baoCaoTuyenDung.cardUngVien'),
      value: summary.ungVien,
      icon: UserPlus,
      className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      title: t('baoCaoTuyenDung.cardPhongVan'),
      value: summary.lichPVDaDienRa,
      icon: CalendarCheck,
      className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
    },
    {
      title: t('baoCaoTuyenDung.cardThuMoi'),
      value: summary.thuMoiNhanViec,
      icon: Mail,
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: t('baoCaoTuyenDung.cardHopDong'),
      value: summary.hopDong,
      icon: FileSignature,
      className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    },
    {
      title: t('baoCaoTuyenDung.cardHopDongThanhLy'),
      value: summary.hopDongThanhLy,
      icon: FileCheck,
      className: 'bg-muted text-muted-foreground border-border',
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
