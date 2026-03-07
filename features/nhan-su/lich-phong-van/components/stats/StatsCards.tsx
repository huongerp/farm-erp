import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  CalendarOff,
  XCircle,
  Video,
  MapPin,
  ClipboardList,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import type { LichPhongVanStatsSummary } from './useLichPhongVanStats';

interface Props {
  summary: LichPhongVanStatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const cards = [
    {
      title: t('lichPhongVan.stats.total'),
      value: summary.total,
      icon: CalendarCheck,
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      title: t('lichPhongVan.trangThai.cho'),
      value: summary.cho,
      icon: Clock,
      className: 'bg-muted text-muted-foreground border-border',
    },
    {
      title: t('lichPhongVan.trangThai.daDienRa'),
      value: summary.daDienRa,
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: t('lichPhongVan.trangThai.hoan'),
      value: summary.hoan,
      icon: CalendarOff,
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: t('lichPhongVan.trangThai.huy'),
      value: summary.huy,
      icon: XCircle,
      className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    },
    {
      title: t('lichPhongVan.hinhThuc.online'),
      value: summary.online,
      icon: Video,
      className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    },
    {
      title: t('lichPhongVan.hinhThuc.offline'),
      value: summary.offline,
      icon: MapPin,
      className: 'bg-muted text-muted-foreground border-border',
    },
    {
      title: t('lichPhongVan.trangThaiDanhGia.chuaDanhGia'),
      value: summary.chuaDanhGia,
      icon: ClipboardList,
      className: 'bg-muted text-muted-foreground border-border',
    },
    {
      title: t('lichPhongVan.trangThaiDanhGia.dat'),
      value: summary.dat,
      icon: ThumbsUp,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: t('lichPhongVan.trangThaiDanhGia.khongDat'),
      value: summary.khongDat,
      icon: ThumbsDown,
      className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
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
