import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Briefcase, Share2 } from 'lucide-react';
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
import type { ChartItem } from '../hooks/useBaoCaoTuyenDungStats';

const CHART_HEIGHT = 220;

interface Props {
  chartFunnel: ChartItem[];
  chartByViTri: ChartItem[];
  chartByNguon: ChartItem[];
}

const StatsCharts: React.FC<Props> = ({ chartFunnel, chartByViTri, chartByNguon }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  const funnelLabels: Record<string, string> = {
    DeXuat: t('baoCaoTuyenDung.cardDeXuat'),
    UngVien: t('baoCaoTuyenDung.cardUngVien'),
    PhongVan: t('baoCaoTuyenDung.cardPhongVan'),
    ThuMoi: t('baoCaoTuyenDung.cardThuMoi'),
    HopDong: t('baoCaoTuyenDung.cardHopDong'),
  };
  const funnelData = chartFunnel.map((d) => ({ ...d, name: funnelLabels[d.name] ?? d.name }));

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

  const hasFunnel = funnelData.length > 0 && funnelData.some((d) => d.value > 0);
  const hasViTri = chartByViTri.length > 0 && chartByViTri.some((d) => d.value > 0);
  const hasNguon = chartByNguon.length > 0 && chartByNguon.some((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {hasFunnel &&
        renderBar(
          funnelData,
          'baoCaoTuyenDung.chartFunnel',
          <BarChart3 size={14} className="text-primary" />
        )}
      {hasViTri &&
        renderBar(
          chartByViTri,
          'baoCaoTuyenDung.tableByViTri',
          <Briefcase size={14} className="text-primary" />
        )}
      {hasNguon &&
        renderBar(
          chartByNguon,
          'baoCaoTuyenDung.tableByNguon',
          <Share2 size={14} className="text-primary" />
        )}
    </div>
  );
};

export default StatsCharts;
