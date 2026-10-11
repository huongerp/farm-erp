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
import { formatSoRutGon } from '../../../../../lib/utils';

/** Nhãn trục tên hàng: cắt gọn, tên đầy đủ xem ở tooltip. */
const catNhan = (s: string, max = 18) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** Chiều cao biểu đồ thanh ngang theo số dòng để nhãn không chồng nhau. */
const caoTheoSoDong = (n: number) => Math.max(STATS_CHART_HEIGHT, n * 28 + 32);

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
          <ResponsiveContainer width="100%" height={caoTheoSoDong(byWarehouse.length)}>
            <BarChart
              data={byWarehouse}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={formatSoRutGon} />
              <YAxis type="category" dataKey="name" width={84} interval={0} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: string) => catNhan(v, 14)} />
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
          {/* Thanh ngang: tên hàng dài đọc được trên điện thoại, không phải xoay chéo nhãn. */}
          <ResponsiveContainer width="100%" height={caoTheoSoDong(topProducts.length)}>
            <BarChart
              data={topProducts}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={formatSoRutGon} />
              <YAxis type="category" dataKey="name" width={120} interval={0} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v: string) => catNhan(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name={t('tonKho.byProduct.totalQty')}>
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
