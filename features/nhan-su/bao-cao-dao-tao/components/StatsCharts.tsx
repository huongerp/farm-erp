import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, BookOpen } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import { CHART_COLORS } from '../core/constants';
import type { ChartItem } from '../hooks/useBaoCaoDaoTaoStats';

const CHART_HEIGHT = 220;

interface Props {
  chartSummary: ChartItem[];
  chartByKhoa: ChartItem[];
}

const StatsCharts: React.FC<Props> = ({ chartSummary, chartByKhoa }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const summaryLabels: Record<string, string> = {
    TongDangKy: t('baoCaoDaoTao.cardTongDangKy'),
    DangHoc: t('baoCaoDaoTao.cardDangHoc'),
    HoanThanh: t('baoCaoDaoTao.cardHoanThanh'),
    Huy: t('baoCaoDaoTao.cardHuy'),
  };
  const summaryData = chartSummary.map((d) => ({ ...d, name: summaryLabels[d.name] ?? d.name }));

  const renderBar = (
    data: ChartItem[],
    titleKey: string,
    icon: React.ReactNode
  ) => (
    <div className="bg-card rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{t(titleKey)}</h3>
      </div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={data}
          barSize={28}
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.5}
          />
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
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const hasSummary = summaryData.length > 0 && summaryData.some((d) => d.value > 0);
  const hasByKhoa = chartByKhoa.length > 0 && chartByKhoa.some((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {hasSummary &&
        renderBar(
          summaryData,
          'baoCaoDaoTao.chartSummary',
          <BarChart3 size={14} className="text-primary" />
        )}
      {hasByKhoa &&
        renderBar(
          chartByKhoa,
          'baoCaoDaoTao.tableByKhoa',
          <BookOpen size={14} className="text-primary" />
        )}
    </div>
  );
};

export default StatsCharts;
