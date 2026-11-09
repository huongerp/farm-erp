import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from '../../../../../components/ui/ChartTooltip';
import { StatsCard } from '../../../../../components/shared/stats';
import type { ThongKeGscl } from '../../core/thong-ke';

const CHART_HEIGHT = 260;
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];
const axisTick = { fontSize: 10, fill: 'var(--muted-foreground)' };

const ddmm = (ymd: string) => (ymd.length >= 10 ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}` : ymd);

interface Props {
  tk: ThongKeGscl;
}

/** Biểu đồ cột chồng: số phiếu đánh giá theo ngày, tách màu theo farm. Ngày tăng dần trên trục X. */
const ThongKeCharts: React.FC<Props> = ({ tk }) => {
  const { t } = useTranslation();
  const farms = tk.farms;

  const data = [...tk.theoNgay]
    .sort((a, b) => a.ngay.localeCompare(b.ngay))
    .map((d) => {
      const row: Record<string, string | number> = { name: ddmm(d.ngay) };
      for (const f of farms) row[f.id] = d.theoFarm[f.id]?.tong ?? 0;
      return row;
    });

  const chuaCo = data.length === 0 || farms.length === 0;

  return (
    <StatsCard title={t('giamSatChatLuong.thongKe.chartTheoNgay')} icon={CalendarDays} spanTwo>
      {chuaCo ? (
        <div
          className="flex items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
          style={{ height: CHART_HEIGHT }}
        >
          {t('giamSatChatLuong.thongKe.chuaCoDuLieu')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {farms.map((f, i) => (
              <Bar
                key={f.id}
                dataKey={f.id}
                stackId="farm"
                name={f.ten}
                fill={COLORS[i % COLORS.length]}
                radius={i === farms.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </StatsCard>
  );
};

export default ThongKeCharts;
