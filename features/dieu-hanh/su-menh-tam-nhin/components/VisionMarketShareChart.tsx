import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart as RechartsPie,
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
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import Select from '../../../../components/ui/Select';
import type { PhanKhucThiPhan, TamNhinThiPhanItem } from '../core/types';
import type { MarketShareChartType } from './vision-chart-constants';
import { VISION_CHART_HEIGHT, VISION_CHART_COLORS } from './vision-chart-constants';

function getValue(targets: TamNhinThiPhanItem[], nam: number, idPhanKhuc: string): number {
  const item = targets.find((t) => t.nam === nam && t.id_phan_khuc === idPhanKhuc);
  return item?.gia_tri ?? 0;
}

interface Props {
  segments: PhanKhucThiPhan[];
  targets: TamNhinThiPhanItem[];
  chartType: MarketShareChartType;
}

const VisionMarketShareChart: React.FC<Props> = ({ segments, targets, chartType }) => {
  const { t } = useTranslation();
  const years = useMemo(() => {
    const set = new Set(targets.map((t) => t.nam));
    return Array.from(set).sort((a, b) => a - b);
  }, [targets]);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const sortedSegments = useMemo(() => [...segments].sort((a, b) => a.thu_tu - b.thu_tu), [segments]);

  const pieData = useMemo(() => {
    return sortedSegments.map((s) => ({
      name: s.ten,
      value: getValue(targets, selectedYear, s.id),
    })).filter((d) => d.value > 0);
  }, [targets, selectedYear, sortedSegments]);

  const barData = useMemo(() => {
    return years.map((nam) => {
      const row: Record<string, number | string> = { name: String(nam) };
      sortedSegments.forEach((s) => {
        row[s.id] = getValue(targets, nam, s.id);
      });
      return row;
    });
  }, [years, sortedSegments, targets]);

  if (sortedSegments.length === 0) return null;

  if (chartType === 'pie') {
    const yearOptions = years.length > 0
      ? years.map((y) => ({ value: String(y), label: String(y) }))
      : [{ value: String(selectedYear), label: String(selectedYear) }];
    return (
      <div className="space-y-3">
        {years.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('suMenhTamNhin.selectYear')}:</span>
            <Select
              options={yearOptions}
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-28"
            />
          </div>
        )}
        {pieData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t('suMenhTamNhin.emptyRevenue')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={VISION_CHART_HEIGHT}>
            <RechartsPie>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={VISION_CHART_COLORS[i % VISION_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value: string) => (
                  <span className="text-muted-foreground text-caption">{value}</span>
                )}
              />
            </RechartsPie>
          </ResponsiveContainer>
        )}
      </div>
    );
  }

  const isHorizontal = chartType === 'barHorizontal';
  if (barData.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">{t('suMenhTamNhin.emptyRevenue')}</p>;

  return (
    <ResponsiveContainer width="100%" height={VISION_CHART_HEIGHT}>
      <BarChart
        data={barData}
        margin={{ top: 8, right: 8, left: 4, bottom: isHorizontal ? 32 : 8 }}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
        {isHorizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={48} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(value: string) => <span className="text-muted-foreground text-caption">{value}</span>} />
        {sortedSegments.map((s, i) => (
          <Bar
            key={s.id}
            dataKey={s.id}
            name={s.ten}
            stackId="share"
            fill={VISION_CHART_COLORS[i % VISION_CHART_COLORS.length]}
            radius={i === sortedSegments.length - 1 ? (isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]) : 0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VisionMarketShareChart;
