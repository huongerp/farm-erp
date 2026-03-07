import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Warehouse, User, UserCheck, TrendingUp } from 'lucide-react';
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
import type { PhieuDeXuatVatTuStatsByTrangThai } from './usePhieuDeXuatVatTuStats';
import type { StatsChartItem } from './usePhieuDeXuatVatTuStats';

interface Props {
  byTrangThai: PhieuDeXuatVatTuStatsByTrangThai[];
  byNoiDeXuat: StatsChartItem[];
  byNguoiDeXuat: StatsChartItem[];
  byNguoiDuyet: StatsChartItem[];
  byMonth: StatsChartItem[];
}

const StatsCharts: React.FC<Props> = ({
  byTrangThai,
  byNoiDeXuat,
  byNguoiDeXuat,
  byNguoiDuyet,
  byMonth,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const statusPieData = byTrangThai
    .filter((d) => d.count > 0)
    .map((d) => ({ name: t(`phieuDeXuatVatTu.${d.ten}`), value: d.count }));
  const hasStatus = statusPieData.length > 0;
  const hasNoiDeXuat = byNoiDeXuat.some((d) => d.value > 0);
  const hasNguoiDeXuat = byNguoiDeXuat.some((d) => d.value > 0);
  const hasNguoiDuyet = byNguoiDuyet.some((d) => d.value > 0);
  const hasByMonth = byMonth.some((d) => d.value > 0);

  const renderBarChart = (
    data: StatsChartItem[],
    titleKey: string,
    icon: React.ReactNode,
    layout: 'vertical' | 'horizontal' = 'vertical'
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
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
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
            </>
          )}
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={layout === 'vertical' ? [0, 6, 6, 0] : [6, 6, 0, 0]} name={t('phieuDeXuatVatTu.stats.countCol')}>
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
              <h3 className="text-xs font-semibold text-foreground">
                {t('phieuDeXuatVatTu.stats.chartByStatus')}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusPieData.map((_, i) => (
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

        {hasByMonth && renderBarChart(byMonth, 'phieuDeXuatVatTu.stats.chartByMonth', <TrendingUp size={14} className="text-primary" />, 'horizontal')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {hasNoiDeXuat && renderBarChart(byNoiDeXuat.slice(0, 8), 'phieuDeXuatVatTu.stats.chartByPlace', <Warehouse size={14} className="text-primary" />)}
        {hasNguoiDeXuat && renderBarChart(byNguoiDeXuat.slice(0, 8), 'phieuDeXuatVatTu.stats.chartByRequester', <User size={14} className="text-primary" />)}
        {hasNguoiDuyet && renderBarChart(byNguoiDuyet.slice(0, 8), 'phieuDeXuatVatTu.stats.chartByApprover', <UserCheck size={14} className="text-primary" />)}
      </div>
    </div>
  );
};

export default StatsCharts;
