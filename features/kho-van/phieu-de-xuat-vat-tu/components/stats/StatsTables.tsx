import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Warehouse, User, UserCheck } from 'lucide-react';
import type { PhieuDeXuatVatTuStatsByTrangThai } from './usePhieuDeXuatVatTuStats';
import type { StatsChartItem } from './usePhieuDeXuatVatTuStats';

interface Props {
  byTrangThai: PhieuDeXuatVatTuStatsByTrangThai[];
  byNoiDeXuat: StatsChartItem[];
  byNguoiDeXuat: StatsChartItem[];
  byNguoiDuyet: StatsChartItem[];
}

function TableBlock({
  titleKey,
  icon: Icon,
  data,
  emptyMessageKey,
}: {
  titleKey: string;
  icon: React.ElementType;
  data: { name: string; value: number }[];
  emptyMessageKey: string;
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
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('phieuDeXuatVatTu.stats.itemNameCol')}
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                {t('phieuDeXuatVatTu.stats.countCol')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const StatsTables: React.FC<Props> = ({ byTrangThai, byNoiDeXuat, byNguoiDeXuat, byNguoiDuyet }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-primary" />
              <h3 className="text-xs font-semibold text-foreground">
                {t('phieuDeXuatVatTu.stats.byStatus')}
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    {t('phieuDeXuatVatTu.stats.nameCol')}
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                    {t('phieuDeXuatVatTu.stats.countCol')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
                {byTrangThai.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                      {t('phieuDeXuatVatTu.stats.noData')}
                    </td>
                  </tr>
                ) : (
                  byTrangThai.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 text-foreground">
                        {t(`phieuDeXuatVatTu.${row.ten}`)}
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
          titleKey="phieuDeXuatVatTu.stats.byPlace"
          icon={Warehouse}
          data={byNoiDeXuat}
          emptyMessageKey="phieuDeXuatVatTu.stats.noData"
        />
        <TableBlock
          titleKey="phieuDeXuatVatTu.stats.byRequester"
          icon={User}
          data={byNguoiDeXuat}
          emptyMessageKey="phieuDeXuatVatTu.stats.noData"
        />
        <TableBlock
          titleKey="phieuDeXuatVatTu.stats.byApprover"
          icon={UserCheck}
          data={byNguoiDuyet}
          emptyMessageKey="phieuDeXuatVatTu.stats.noData"
        />
      </div>
    </div>
  );
};

export default StatsTables;
