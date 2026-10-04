import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, BarChart3, Package } from 'lucide-react';
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
import { formatCurrency } from '../../../../../lib/utils';
import { STATS_CHART_HEIGHT, CHART_COLORS, TOP_TAI_SAN } from './stats-constants';
import type { NhomThongKe, ThangThongKe } from '../../core/thong-ke';

interface Props {
  byHangMuc: NhomThongKe[];
  byThang: ThangThongKe[];
  byTaiSan: NhomThongKe[];
}

/** Trục tiền gọn: 1.200.000 → "1,2tr". */
function rutGonTien(v: number): string {
  const f = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  if (Math.abs(v) >= 1e9) return `${f(v / 1e9)} tỷ`;
  if (Math.abs(v) >= 1e6) return `${f(v / 1e6)}tr`;
  if (Math.abs(v) >= 1e3) return `${f(v / 1e3)}k`;
  return f(v);
}

const truc = { tick: { fontSize: 10, fill: 'var(--muted-foreground)' }, axisLine: false, tickLine: false } as const;

const StatsCharts: React.FC<Props> = ({ byHangMuc, byThang, byTaiSan }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const pieHangMuc = byHangMuc.filter((d) => d.tongTien > 0).map((d) => ({ name: d.ten, value: d.tongTien }));
  const barThang = byThang.map((d) => ({ name: d.nhan, value: d.tongTien }));
  const barTaiSan = byTaiSan
    .filter((d) => d.tongTien > 0)
    .slice(0, TOP_TAI_SAN)
    .map((d) => ({ name: d.ten, value: d.tongTien }));
  if (pieHangMuc.length === 0 && barThang.length === 0 && barTaiSan.length === 0) return null;

  const tenSeries = t('baoTriSuaChua.stats.amountCol');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {pieHangMuc.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">{t('baoTriSuaChua.stats.chiPhiTheoHangMuc')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <PieChart>
              <Pie data={pieHangMuc} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                {pieHangMuc.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatValue={formatCurrency} />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value: string) => <span className="text-muted-foreground text-caption">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {barThang.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">{t('baoTriSuaChua.stats.chiPhiTheoThang')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={STATS_CHART_HEIGHT}>
            <BarChart data={barThang} barSize={24} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" {...truc} />
              <YAxis {...truc} tickFormatter={rutGonTien} width={52} />
              <Tooltip content={<ChartTooltip formatValue={formatCurrency} />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name={tenSeries} fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {barTaiSan.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3.5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('baoTriSuaChua.stats.topTaiSan', { count: TOP_TAI_SAN })}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(STATS_CHART_HEIGHT, barTaiSan.length * 30)}>
            <BarChart data={barTaiSan} layout="vertical" barSize={18} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
              <XAxis type="number" {...truc} tickFormatter={rutGonTien} />
              <YAxis type="category" dataKey="name" {...truc} width={180} />
              <Tooltip content={<ChartTooltip formatValue={formatCurrency} />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name={tenSeries}>
                {barTaiSan.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
