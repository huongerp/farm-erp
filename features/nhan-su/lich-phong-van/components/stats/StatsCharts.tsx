import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleDot, Video, ClipboardCheck } from 'lucide-react';
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

export interface ChartItem {
  name: string;
  value: number;
}

interface Props {
  chartByTrangThai: ChartItem[];
  chartByHinhThuc: ChartItem[];
  chartByTrangThaiDanhGia: ChartItem[];
}

const StatsCharts: React.FC<Props> = ({
  chartByTrangThai,
  chartByHinhThuc,
  chartByTrangThaiDanhGia,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const hasTrangThai = chartByTrangThai.length > 0 && chartByTrangThai.some((d) => d.value > 0);
  const hasHinhThuc = chartByHinhThuc.length > 0 && chartByHinhThuc.some((d) => d.value > 0);
  const hasDanhGia =
    chartByTrangThaiDanhGia.length > 0 &&
    chartByTrangThaiDanhGia.some((d) => d.value > 0);

  const renderPie = (
    data: ChartItem[],
    titleKey: string,
    icon: React.ReactNode
  ) => (
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

  const renderBar = (
    data: ChartItem[],
    titleKey: string,
    icon: React.ReactNode
  ) => (
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
          <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('lichPhongVan.stats.countCol')}>
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
      {hasTrangThai &&
        renderPie(
          chartByTrangThai,
          'lichPhongVan.stats.byTrangThai',
          <CircleDot size={14} className="text-primary" />
        )}
      {hasHinhThuc &&
        renderPie(
          chartByHinhThuc,
          'lichPhongVan.stats.byHinhThuc',
          <Video size={14} className="text-primary" />
        )}
      {hasDanhGia &&
        renderBar(
          chartByTrangThaiDanhGia,
          'lichPhongVan.stats.byTrangThaiDanhGia',
          <ClipboardCheck size={14} className="text-primary" />
        )}
    </div>
  );
};

export default StatsCharts;
