import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
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
import { STATS_CHART_HEIGHT } from '../../core/stats-constants';
import type { DeptChartItem, PeriodChartItem } from '../../hooks/use-bang-luong-stats';

interface Props {
  deptChartData: DeptChartItem[];
  periodChartData: PeriodChartItem[];
  deptColors: string[];
}

const StatsCharts: React.FC<Props> = ({ deptChartData, periodChartData, deptColors }) => {
  const { t } = useTranslation();

  if (deptChartData.length === 0 && periodChartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {deptChartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('bangLuong.stats.byDepartment')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={deptChartData}
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={38}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {deptChartData.map((_, i) => (
                  <Cell key={i} fill={deptColors[i % deptColors.length]} />
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

      {periodChartData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('bangLuong.stats.byPeriod')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={periodChartData}
              barSize={24}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="period"
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
              <Bar dataKey="total" radius={[6, 6, 0, 0]} name={t('bangLuong.stats.totalRecords')}>
                {periodChartData.map((_, i) => (
                  <Cell key={i} fill={deptColors[i % deptColors.length]} />
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
