import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, BarChart3, Package } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChartTooltip from '../../../../../components/ui/ChartTooltip';
import { STATS_CHART_HEIGHT, CHART_COLORS } from './stats-constants';

interface ChartItem {
  name: string;
  value: number;
}

interface Props {
  chartByHangMuc: ChartItem[];
  chartByMonth: ChartItem[];
  chartByTaiSan: ChartItem[];
}

const StatsCharts: React.FC<Props> = ({
  chartByHangMuc,
  chartByMonth,
  chartByTaiSan,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const hasAny =
    chartByHangMuc.some((d) => d.value > 0) ||
    chartByMonth.some((d) => d.value > 0) ||
    chartByTaiSan.some((d) => d.value > 0);
  if (!hasAny) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {chartByHangMuc.some((d) => d.value > 0) && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('baoTriSuaChua.stats.byHangMuc')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={chartByHangMuc.filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartByHangMuc.filter((d) => d.value > 0).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value: string) => (
                  <span className="text-muted-foreground text-caption">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartByMonth.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('baoTriSuaChua.stats.byMonth')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={chartByMonth}
              barSize={24}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('danhSachTaiSan.stats.count')}>
                {chartByMonth.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartByTaiSan.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3.5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('baoTriSuaChua.stats.byTaiSan')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={chartByTaiSan}
              barSize={28}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('danhSachTaiSan.stats.count')}>
                {chartByTaiSan.map((_, i) => (
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
