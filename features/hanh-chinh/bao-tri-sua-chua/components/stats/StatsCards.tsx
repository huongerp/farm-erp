import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Wallet, BadgeCheck, Hourglass, Boxes } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/utils';
import type { TongQuanThongKe } from '../../core/thong-ke';

interface Props {
  summary: TongQuanThongKe;
}

const cardClass = 'bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm';
const cardHighlightClass = 'bg-card rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3 transition-all hover:shadow-sm';
const iconWrapClass = 'w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0';

const Card: React.FC<{ icon: React.ReactNode; label: string; value: string; highlight?: boolean }> = ({
  icon,
  label,
  value,
  highlight,
}) => (
  <div className={highlight ? cardHighlightClass : cardClass}>
    <div className="flex items-center gap-2.5">
      <div className={iconWrapClass}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-2xs truncate ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
        <p className={`text-lg font-bold tabular-nums mt-0.5 truncate ${highlight ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </p>
      </div>
    </div>
  </div>
);

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const icon = (I: typeof FileText) => <I size={15} className="text-primary" />;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      <Card highlight icon={icon(Wallet)} label={t('baoTriSuaChua.stats.tongChiPhi')} value={formatCurrency(summary.tongTien)} />
      <Card icon={icon(BadgeCheck)} label={t('baoTriSuaChua.stats.chiPhiDaDuyet')} value={formatCurrency(summary.tienDaDuyet)} />
      <Card icon={icon(FileText)} label={t('baoTriSuaChua.stats.total')} value={summary.soPhieu.toLocaleString('vi-VN')} />
      <Card icon={icon(Hourglass)} label={t('baoTriSuaChua.stats.choDuyet')} value={summary.soChoDuyet.toLocaleString('vi-VN')} />
      <Card icon={icon(Boxes)} label={t('baoTriSuaChua.stats.uniqueAssets')} value={summary.soTaiSan.toLocaleString('vi-VN')} />
    </div>
  );
};

export default StatsCards;
