import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, MapPin, Package } from 'lucide-react';
import type { TonKhoStatsSummary } from './useTonKhoStats';

const CARD_CLASS = 'bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm';
const ICON_WRAP_CLASS = 'w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0';
const ICON_CLASS = 'text-primary';

interface Props {
  summary: TonKhoStatsSummary;
}

const StatsCards: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const items = [
    { labelKey: 'tonKho.stats.totalStock', value: summary.totalStock.toLocaleString(), icon: Layers },
    { labelKey: 'tonKho.stats.warehouses', value: String(summary.warehouseCount), icon: MapPin },
    { labelKey: 'tonKho.stats.productsWithStock', value: String(summary.productCount), icon: Package },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.labelKey} className={CARD_CLASS}>
            <div className="flex items-center gap-2.5">
              <div className={ICON_WRAP_CLASS}>
                <Icon size={15} className={ICON_CLASS} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xs text-muted-foreground truncate">{t(item.labelKey)}</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{item.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
