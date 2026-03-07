import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, ArrowDownCircle, User } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/utils';
import type { DeXuatChiPhiStatsByTrangThai } from './useDeXuatChiPhiStats';
import type { DeXuatChiPhiStatsByLoai } from './useDeXuatChiPhiStats';
import type { StatsChartItem } from './useDeXuatChiPhiStats';

interface Props {
  byTrangThai: DeXuatChiPhiStatsByTrangThai[];
  byLoai: DeXuatChiPhiStatsByLoai[];
  byNguoiDeXuat: StatsChartItem[];
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
    <div className="bg-card rounded-xl border border-border overflow-hidden print:break-inside-avoid">
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
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('deXuatChiPhi.stats.nameCol')}
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                {t('deXuatChiPhi.stats.countCol')}
              </th>
              {showAmount && (
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                  {t('deXuatChiPhi.stats.amountCol')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={showAmount ? 4 : 3}
                  className="px-4 py-6 text-center text-muted-foreground text-sm"
                >
                  {t(emptyMessageKey)}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={`${row.name}-${idx}`} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td
                    className="px-4 py-2 text-foreground font-medium truncate max-w-[180px]"
                    title={row.name}
                  >
                    {row.name}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{row.value}</td>
                  {showAmount && (
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-foreground">
                      {row.amount != null ? formatCurrency(row.amount) : '—'}
                    </td>
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

const StatsTables: React.FC<Props> = ({ byTrangThai, byLoai, byNguoiDeXuat }) => {
  const { t } = useTranslation();

  const nguoiDeXuatTableData: { name: string; value: number }[] = byNguoiDeXuat.map((d) => ({
    name: d.name,
    value: d.value,
  }));

  const loaiTableData = byLoai.map((d) => ({
    name: t(`deXuatChiPhi.${d.ten}`),
    value: d.count,
    amount: d.tongTien,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border overflow-hidden print:break-inside-avoid">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-primary" />
              <h3 className="text-xs font-semibold text-foreground">
                {t('deXuatChiPhi.stats.byStatus')}
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    {t('deXuatChiPhi.stats.nameCol')}
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                    {t('deXuatChiPhi.stats.countCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
                {byTrangThai.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                      {t('deXuatChiPhi.stats.noData')}
                    </td>
                  </tr>
                ) : (
                  byTrangThai.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 text-foreground">
                        {t(`deXuatChiPhi.${row.ten}`)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {row.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <TableBlock
          titleKey="deXuatChiPhi.stats.byLoai"
          icon={ArrowDownCircle}
          data={loaiTableData}
          emptyMessageKey="deXuatChiPhi.stats.noData"
          showAmount
        />
        <TableBlock
          titleKey="deXuatChiPhi.stats.byRequester"
          icon={User}
          data={nguoiDeXuatTableData}
          emptyMessageKey="deXuatChiPhi.stats.noData"
        />
      </div>
    </div>
  );
};

export default StatsTables;
