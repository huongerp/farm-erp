import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Building2, Building, TrendingUp, Folder } from 'lucide-react';
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
import type { ThanhToanDoiTacStatsByTrangThai } from './useThanhToanDoiTacStats';
import type { StatsChartItem, StatsChartItemAmount } from './useThanhToanDoiTacStats';

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

/** Tooltip hiển thị value dạng tiền VND */
function AmountTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      {label != null && label !== '' && <p className="font-medium text-foreground mb-1">{label}</p>}
      <p className="text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
        {formatVnd(Number(p.value) || 0)}
      </p>
    </div>
  );
}

interface Props {
  byTrangThai: ThanhToanDoiTacStatsByTrangThai[];
  byDoiTac: StatsChartItemAmount[];
  byDonVi: StatsChartItemAmount[];
  byNhom: StatsChartItemAmount[];
  byMonth: StatsChartItem[];
  byMonthAmount: StatsChartItem[];
}

const StatsCharts: React.FC<Props> = ({ byTrangThai, byDoiTac, byDonVi, byNhom, byMonth, byMonthAmount }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const statusPieData = byTrangThai.filter((d) => d.count > 0).map((d) => ({ name: d.ten, value: d.count }));
  const hasStatus = statusPieData.length > 0;
  const hasDoiTac = byDoiTac.some((d) => d.value > 0 || d.amount > 0);
  const hasDonVi = byDonVi.some((d) => d.value > 0 || d.amount > 0);
  const hasNhom = byNhom.some((d) => d.value > 0 || d.amount > 0);
  const hasByMonth = byMonth.some((d) => d.value > 0);
  const hasByMonthAmount = byMonthAmount.some((d) => d.value > 0);

  const byDoiTacChartData: StatsChartItem[] = byDoiTac.map((d) => ({ name: d.name, value: d.amount }));
  const byDonViChartData: StatsChartItem[] = byDonVi.map((d) => ({ name: d.name, value: d.amount }));
  const byNhomChartData: StatsChartItem[] = byNhom.map((d) => ({ name: d.name, value: d.amount }));

  const renderBarChart = (
    data: StatsChartItem[],
    titleKey: string,
    icon: React.ReactNode,
    layout: 'vertical' | 'horizontal' = 'vertical',
    isAmount = false
  ) => (
    <div className="bg-card rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{t(titleKey)}</h3>
      </div>
      <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: 4, bottom: layout === 'horizontal' ? 24 : 4 }}
          layout={layout}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          {layout === 'vertical' ? (
            <>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={isAmount ? (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}tr` : v) : undefined} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={56} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={isAmount ? (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(0)}tr` : String(v)) : undefined} />
            </>
          )}
          <Tooltip content={isAmount ? <AmountTooltip /> : <ChartTooltip />} />
          <Bar dataKey="value" radius={layout === 'vertical' ? [0, 6, 6, 0] : [6, 6, 0, 0]} name={isAmount ? t('thanhToanDoiTac.stats.amount') : t('thanhToanDoiTac.stats.countCol')}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hasStatus && (
          <div className="bg-card rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-primary" />
              <h3 className="text-xs font-semibold text-foreground">{t('thanhToanDoiTac.stats.byStatus')}</h3>
            </div>
            <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                  {statusPieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(value: string) => <span className="text-muted-foreground text-caption">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasByMonth && renderBarChart(byMonth, 'thanhToanDoiTac.stats.byMonth', <TrendingUp size={14} className="text-primary" />, 'horizontal')}
        {hasByMonthAmount && renderBarChart(byMonthAmount, 'thanhToanDoiTac.stats.byMonthAmount', <TrendingUp size={14} className="text-primary" />, 'horizontal', true)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {hasNhom && renderBarChart(byNhomChartData.slice(0, 8), 'thanhToanDoiTac.stats.byNhomDoiTac', <Folder size={14} className="text-primary" />, 'vertical', true)}
        {hasDoiTac && renderBarChart(byDoiTacChartData.slice(0, 8), 'thanhToanDoiTac.stats.byDoiTac', <Building2 size={14} className="text-primary" />, 'vertical', true)}
        {hasDonVi && renderBarChart(byDonViChartData.slice(0, 8), 'thanhToanDoiTac.stats.byDonVi', <Building size={14} className="text-primary" />, 'vertical', true)}
      </div>
    </div>
  );
};

export default StatsCharts;
