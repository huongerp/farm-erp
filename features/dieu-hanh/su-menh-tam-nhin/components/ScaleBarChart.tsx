import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import { VISION_CHART_HEIGHT, VISION_CHART_COLORS } from './vision-chart-constants';

export interface ScaleChartPoint {
  name: string;
  value: number;
}

/** vertical = cột đứng lên, horizontal = cột nằm ngang */
export type ScaleChartLayout = 'vertical' | 'horizontal';

interface Props {
  data: ScaleChartPoint[];
  valueLabel?: string;
  barColor?: string;
  valueSuffix?: string;
  layout?: ScaleChartLayout;
  height?: number;
}

const ScaleBarChart: React.FC<Props> = ({ data, valueLabel, barColor, valueSuffix, layout = 'vertical', height = VISION_CHART_HEIGHT }) => {
  if (!data.length) return null;
  const color = barColor ?? VISION_CHART_COLORS[0];
  const isHorizontal = layout === 'horizontal';
  const tickFmt = valueSuffix ? (v: number) => `${v}${valueSuffix}` : undefined;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          barSize={isHorizontal ? 18 : 28}
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={tickFmt}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={40}
                interval={0}
              />
            </>
          ) : (
            <>
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
                tickFormatter={tickFmt}
              />
            </>
          )}
          <Tooltip content={<ChartTooltip />} />
          <Bar
            dataKey="value"
            name={valueLabel ?? ''}
            radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScaleBarChart;
