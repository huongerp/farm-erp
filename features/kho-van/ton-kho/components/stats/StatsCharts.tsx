import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Package } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartTooltip from '../../../../../components/ui/ChartTooltip';
import { STATS_CHART_HEIGHT, CHART_COLORS } from './stats-constants';

export interface ChartItem {
  name: string;
  value: number;
}

interface Props {
  byWarehouse: ChartItem[];
  topProducts: ChartItem[];
}

const StatsCharts: React.FC<Props> = ({ byWarehouse, topProducts }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const hasWarehouse = byWarehouse.some((d) => d.value > 0);
  const hasProducts = topProducts.some((d) => d.value > 0);
  if (!hasWarehouse && !hasProducts) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {hasWarehouse && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('tonKho.stats.byWarehouse')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={byWarehouse}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name={t('tonKho.stats.qtyCol')}>
                {byWarehouse.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasProducts && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('tonKho.stats.topProducts')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={topProducts}
              margin={{ top: 4, right: 4, left: 4, bottom: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                angle={-20}
                textAnchor="end"
                height={56}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('tonKho.byProduct.totalQty')}>
                {topProducts.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StatsCharts;
