import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import StatsCard from '../../../../components/shared/stats/StatsCard';
import { formatNumberVN } from '../../../../lib/utils';
import { CHART_COLORS, CHART_HEIGHT } from '../core/constants';
import type { ThongKeQuyRow } from '../core/types';

interface Props {
  theoThang: ThongKeQuyRow[];
  chiTheoHangMuc: { ten: string; chi: number; tyLe: number }[];
}

const money = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });
/** Trục tiền: rút gọn để nhãn không tràn (12.500.000 → 12,5tr). */
const shortMoney = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}tỷ`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
};

const StatsCharts: React.FC<Props> = ({ theoThang, chiTheoHangMuc }) => {
  const { t } = useTranslation();

  const barData = theoThang.map((r) => ({
    name: r.thang ?? '',
    [t('thuChiQuy.store.thuCol')]: r.thu,
    [t('thuChiQuy.store.chiCol')]: r.chi,
  }));
  const pieData = chiTheoHangMuc.map((r) => ({ name: r.ten, value: r.chi }));

  return (
    <>
      <StatsCard title={t('thongKeQuy.tables.theoThang')} icon={TrendingUp}>
        {barData.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={shortMoney} />
              <Tooltip formatter={(v) => money(Number(v))} content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={t('thuChiQuy.store.thuCol')} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey={t('thuChiQuy.store.chiCol')} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </StatsCard>

      <StatsCard title={t('thongKeQuy.charts.coCauChi')} icon={PieChartIcon}>
        {pieData.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={42}>
                {pieData.map((entry, idx) => (
                  <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => money(Number(v))} content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </StatsCard>
    </>
  );
};

export default StatsCharts;
