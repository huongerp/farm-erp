import React from 'react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import type { LoaiBieuDoThiPhan } from '../core/types';

interface Props {
  /** % thị phần (vd. 4 → 4%) */
  percent: number;
  /** Tên phân khúc (hiện trong tooltip) */
  segmentName: string;
  /** Năm (hiện dưới chart) */
  year: number;
  chartType: LoaiBieuDoThiPhan;
  /** Màu chính cho phần thị phần */
  color?: string;
  height?: number;
}

const REST_COLOR = '#e5e7eb';

const VisionSegmentChart: React.FC<Props> = ({ percent, segmentName, year, chartType, color = '#6366f1', height = 140 }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const data = [
    { name: segmentName, value: clamped },
    { name: 'Còn lại', value: +(100 - clamped).toFixed(2) },
  ];

  const isDonut = chartType === 'donut';
  const outerR = height < 160 ? 46 : 58;
  const innerR = isDonut ? Math.round(outerR * 0.58) : 0;
  const chartSize = outerR * 2 + 20;

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <div style={{ width: chartSize, height: chartSize }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPie>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={outerR}
              innerRadius={innerR}
              paddingAngle={clamped > 0 && clamped < 100 ? 2 : 0}
              dataKey="value"
              nameKey="name"
              stroke="none"
              startAngle={90}
              endAngle={-270}
              label={false}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            >
              <Cell fill={color} />
              <Cell fill={REST_COLOR} opacity={0.5} />
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </RechartsPie>
        </ResponsiveContainer>
        {isDonut && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-bold text-foreground tabular-nums leading-none">
              {clamped}
              <span className="text-[10px] font-semibold text-muted-foreground">%</span>
            </span>
          </div>
        )}
      </div>
      <div className="text-center leading-tight">
        <p className="text-xs font-semibold text-foreground tabular-nums">{year}</p>
        {!isDonut && (
          <p className="text-[11px] font-medium tabular-nums" style={{ color }}>
            {clamped}%
          </p>
        )}
      </div>
    </div>
  );
};

export default VisionSegmentChart;
