import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, ListTodo, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { getTrangThaiLabel, getUuTienLabel } from '../../cong-viec/core/constants';
import type { CongViecTrangThai, CongViecUuTien } from '../../cong-viec/core/types';
import { StatsKpiGrid, StatsTableCard } from '../../../../components/shared/stats';
import type { StatsKpiCardItem, StatsTableRow } from '../../../../components/shared/stats';

interface Summary {
  total: number;
  hoanThanh: number;
  dangThucHien: number;
  choBaoCao: number;
}

interface ByDuAn {
  id: string;
  name: string;
  count: number;
}

interface ByPhongBan {
  id: string;
  name: string;
  count: number;
}

interface Props {
  summary: Summary;
  byTrangThai: { name: string; count: number }[];
  byUuTien: { name: string; count: number }[];
  byDuAn: ByDuAn[];
  byPhongBan: ByPhongBan[];
}

const BaoCaoStats: React.FC<Props> = ({
  summary,
  byTrangThai,
  byUuTien,
  byDuAn,
  byPhongBan,
}) => {
  const { t } = useTranslation();

  const kpis: StatsKpiCardItem[] = useMemo(
    () => [
      {
        id: 'total',
        label: t('baoCao.summary.total'),
        value: summary.total,
        icon: ListTodo,
        color: 'text-primary',
        bg: 'bg-primary/15',
        pct: null,
        delta: null,
      },
      {
        id: 'hoanThanh',
        label: t('baoCao.summary.hoanThanh'),
        value: summary.hoanThanh,
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/15',
        pct: null,
        delta: null,
      },
      {
        id: 'dangThucHien',
        label: t('baoCao.summary.dangThucHien'),
        value: summary.dangThucHien,
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-500/15',
        pct: null,
        delta: null,
      },
      {
        id: 'choBaoCao',
        label: t('baoCao.summary.choBaoCao'),
        value: summary.choBaoCao,
        icon: MessageSquare,
        color: 'text-amber-600',
        bg: 'bg-amber-500/15',
        pct: null,
        delta: null,
      },
    ],
    [summary, t]
  );

  const trangThaiRows: StatsTableRow[] = useMemo(
    () =>
      byTrangThai.map((row) => ({
        id: row.name,
        label: getTrangThaiLabel(row.name as CongViecTrangThai, t),
        value: row.count,
      })),
    [byTrangThai, t]
  );

  const uuTienRows: StatsTableRow[] = useMemo(
    () =>
      byUuTien.map((row) => ({
        id: row.name,
        label: getUuTienLabel(row.name as CongViecUuTien, t),
        value: row.count,
      })),
    [byUuTien, t]
  );

  const duAnRows: StatsTableRow[] = useMemo(
    () => byDuAn.map((row) => ({ id: row.id, label: row.name, value: row.count })),
    [byDuAn]
  );

  const phongBanRows: StatsTableRow[] = useMemo(
    () => byPhongBan.map((row) => ({ id: row.id, label: row.name, value: row.count })),
    [byPhongBan]
  );

  return (
    <div className="space-y-6">
      <StatsKpiGrid items={kpis} columns={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsTableCard
          title={t('baoCao.byTrangThai')}
          icon={BarChart3}
          rows={trangThaiRows}
          columnLabelKey="baoCao.colStatus"
          columnValueKey="baoCao.colCount"
          emptyKey="baoCao.noData"
        />
        <StatsTableCard
          title={t('baoCao.byUuTien')}
          icon={BarChart3}
          rows={uuTienRows}
          columnLabelKey="baoCao.colPriority"
          columnValueKey="baoCao.colCount"
          emptyKey="baoCao.noData"
        />
        <StatsTableCard
          title={t('baoCao.byDuAn')}
          rows={duAnRows}
          columnLabelKey="baoCao.colProject"
          columnValueKey="baoCao.colCount"
          maxHeight="max-h-[240px]"
          emptyKey="baoCao.noData"
        />
        <StatsTableCard
          title={t('baoCao.byPhongBan')}
          rows={phongBanRows}
          columnLabelKey="baoCao.colDepartment"
          columnValueKey="baoCao.colCount"
          maxHeight="max-h-[240px]"
          emptyKey="baoCao.noData"
        />
      </div>
    </div>
  );
};

export default BaoCaoStats;
