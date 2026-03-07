import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Briefcase, Share2 } from 'lucide-react';
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
  chartByStatus: ChartItem[];
  chartByViTri: ChartItem[];
  chartByNguon: ChartItem[];
}

const StatsCharts: React.FC<Props> = ({ chartByStatus, chartByViTri, chartByNguon }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const hasStatus = chartByStatus.length > 0 && chartByStatus.some((d) => d.value > 0);
  const hasViTri = chartByViTri.length > 0;
  const hasNguon = chartByNguon.length > 0;

  const renderPie = (data: ChartItem[], titleKey: string, icon: React.ReactNode) => (
    <div className="bg-card rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{t(titleKey)}</h3>
      </div>
      <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
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
  );

  const renderBar = (data: ChartItem[], titleKey: string, icon: React.ReactNode) => (
    <div className="bg-card rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{t(titleKey)}</h3>
      </div>
      <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
        <BarChart
          data={data}
          barSize={28}
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.5}
          />
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
          <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('ungVien.stats.count')}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {hasStatus && renderPie(chartByStatus, 'ungVien.stats.byStatus', <Tag size={14} className="text-primary" />)}
      {hasViTri && renderBar(chartByViTri, 'ungVien.stats.byViTri', <Briefcase size={14} className="text-primary" />)}
      {hasNguon && renderBar(chartByNguon, 'ungVien.stats.byNguon', <Share2 size={14} className="text-primary" />)}
    </div>
  );
};

export default StatsCharts;
