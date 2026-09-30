import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Package, Timer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from '../../../../../components/ui/ChartTooltip';
import { StatsCard } from '../../../../../components/shared/stats';
import type { ThongKeDangKyNhanHang } from '../../core/thong-ke';

const CHART_HEIGHT = 240;
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const axisTick = { fontSize: 10, fill: 'var(--muted-foreground)' };

const ddmm = (ymd: string) => (ymd.length >= 10 ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}` : ymd);

const ThongKeCharts: React.FC<{ tk: ThongKeDangKyNhanHang }> = ({ tk }) => {
  const { t } = useTranslation();
  const theoNgay = tk.theoNgay.map((n) => ({
    name: ddmm(n.key),
    soXe: n.soXe,
    soLuong: n.soLuong,
    tbPhut: n.tbPhut,
  }));
  const coPhut = theoNgay.some((n) => n.tbPhut != null);
  const pie = tk.theoHangHoa.slice(0, 8).map((h) => ({ name: h.ten_hang_hoa || h.ma_hang_hoa, value: h.soLuong }));
  const khac = tk.theoHangHoa.slice(8).reduce((s, h) => s + h.soLuong, 0);
  if (khac > 0) pie.push({ name: t('dangKyNhanHang.stats.khac'), value: khac });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {theoNgay.length > 0 && (
        <StatsCard title={t('dangKyNhanHang.stats.chartTheoNgay')} icon={CalendarDays} spanTwo>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={theoNgay} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="xe" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="sl" orientation="right" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="xe" dataKey="soXe" name={t('dangKyNhanHang.stats.soXe')} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="sl" dataKey="soLuong" name={t('dangKyNhanHang.stats.soThung')} fill={COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </StatsCard>
      )}
      {coPhut && (
        <StatsCard title={t('dangKyNhanHang.stats.chartThoiGianTb')} icon={Timer}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={theoNgay} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="tbPhut"
                name={t('dangKyNhanHang.stats.tbPhut')}
                stroke={COLORS[2]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </StatsCard>
      )}
      {pie.length > 0 && (
        <StatsCard title={t('dangKyNhanHang.stats.chartHangHoa')} icon={Package}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2} dataKey="value" stroke="none">
                {pie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </StatsCard>
      )}
    </div>
  );
};

export default ThongKeCharts;
