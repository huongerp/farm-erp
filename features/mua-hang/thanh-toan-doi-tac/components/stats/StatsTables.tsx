import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Building2, Building } from 'lucide-react';
import type { ThanhToanDoiTacStatsByTrangThai } from './useThanhToanDoiTacStats';
import type { StatsChartItemAmount } from './useThanhToanDoiTacStats';

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function TableBlock({
  titleKey,
  icon: Icon,
  data,
  emptyMessageKey,
  showAmount,
}: {
  titleKey: string;
  icon: React.ElementType;
  data: { name: string; value: number; amount?: number }[];
  emptyMessageKey: string;
  showAmount?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground">{t(titleKey)}</h3>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/95 z-[1]">
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-8">#</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('thanhToanDoiTac.stats.nameCol')}</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t('thanhToanDoiTac.stats.countCol')}</th>
              {showAmount && (
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t('thanhToanDoiTac.stats.amountCol')}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={showAmount ? 4 : 3} className="px-4 py-6 text-center text-muted-foreground text-sm">
                  {t(emptyMessageKey)}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={`${row.name}-${idx}`} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2 text-foreground font-medium truncate max-w-[180px]" title={row.name}>
                    {row.name}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{row.value}</td>
                  {showAmount && row.amount != null && (
                    <td className="px-4 py-2 text-right font-medium tabular-nums text-muted-foreground">{formatVnd(row.amount)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Props {
  byTrangThai: ThanhToanDoiTacStatsByTrangThai[];
  byDoiTac: StatsChartItemAmount[];
  byDonVi: StatsChartItemAmount[];
}

const StatsTables: React.FC<Props> = ({ byTrangThai, byDoiTac, byDonVi }) => {
  const { t } = useTranslation();

  const statusTableData = byTrangThai.map((r) => ({ name: r.ten, value: r.count, amount: r.amount }));
  const doiTacTableData = byDoiTac.map((r) => ({ name: r.name, value: r.value, amount: r.amount }));
  const donViTableData = byDonVi.map((r) => ({ name: r.name, value: r.value, amount: r.amount }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">{t('thanhToanDoiTac.stats.byStatus')}</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('thanhToanDoiTac.stats.nameCol')}</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thanhToanDoiTac.stats.countCol')}</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('thanhToanDoiTac.stats.amountCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {byTrangThai.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    {t('thanhToanDoiTac.stats.noData')}
                  </td>
                </tr>
              ) : (
                byTrangThai.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2 text-foreground">{row.ten}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.count}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatVnd(row.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TableBlock titleKey="thanhToanDoiTac.stats.byDoiTac" icon={Building2} data={doiTacTableData} emptyMessageKey="thanhToanDoiTac.stats.noData" showAmount />
      <TableBlock titleKey="thanhToanDoiTac.stats.byDonVi" icon={Building} data={donViTableData} emptyMessageKey="thanhToanDoiTac.stats.noData" showAmount />
    </div>
  );
};

export default StatsTables;
