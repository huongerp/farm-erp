import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, Users, Clock, Package, Layers } from 'lucide-react';
import ChartTooltip from '../../../../../components/ui/ChartTooltip';
import { STATS_CHART_HEIGHT, CHART_COLORS } from './stats-constants';
import type { ThongKeSanXuatStats } from './useThongKeSanXuatStats';

interface Props {
  stats: ThongKeSanXuatStats;
}

const axisStyle = { fontSize: 10, fill: 'var(--muted-foreground)' };
const gridProps = { strokeDasharray: '3 3', stroke: 'var(--border)', opacity: 0.5 };

function ChartCard({
  title,
  icon: Icon,
  children,
  span2 = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={`bg-card rounded-xl border border-border p-3.5${span2 ? ' lg:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-primary" />
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const StatsCharts: React.FC<Props> = ({ stats }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const { kpiPieData, chartCongQD, chartGioTC, chartThung, chartBuongSoChe } = stats;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

      {/* ── Pie: Phân bố KPI ─────────────────────────────────────────────── */}
      {kpiPieData.length > 0 && (
        <ChartCard title="Phân bố ngày theo KPI" icon={CheckCircle2}>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={kpiPieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={42}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {kpiPieData.map((item, i) => (
                  <Cell key={i} fill={item.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value: string) => (
                  <span className="text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Bar: Công quy đổi theo chi nhánh ─────────────────────────────── */}
      {chartCongQD.length > 0 && (
        <ChartCard title="Tổng công quy đổi theo chi nhánh" icon={Users}>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={chartCongQD}
              barSize={32}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Công quy đổi" radius={[6, 6, 0, 0]}>
                {chartCongQD.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Bar: Thùng KH vs TT theo chi nhánh ───────────────────────────── */}
      {chartThung.length > 0 && (
        <ChartCard title="Thùng đóng gói: Kế hoạch vs Thực tế" icon={Package}>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={chartThung}
              barSize={18}
              barGap={2}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="kh" name="Kế hoạch" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tt" name="Thực tế" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Bar: Buồng sơ chế theo chi nhánh ────────────────────────────── */}
      {chartBuongSoChe.length > 0 && (
        <ChartCard title="Buồng sơ chế theo chi nhánh" icon={Layers}>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={chartBuongSoChe}
              barSize={32}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Buồng SC" radius={[6, 6, 0, 0]}>
                {chartBuongSoChe.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Bar: Giờ tăng ca theo chi nhánh ─────────────────────────────── */}
      {chartGioTC.length > 0 && (
        <ChartCard title="Giờ tăng ca tổng theo chi nhánh" icon={Clock} span2={chartThung.length === 0 && chartBuongSoChe.length === 0}>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart
              data={chartGioTC}
              barSize={32}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Giờ TC" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

export default StatsCharts;
