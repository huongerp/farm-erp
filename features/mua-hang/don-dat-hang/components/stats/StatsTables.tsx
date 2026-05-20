import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Building2, User, Layers, FolderTree, Filter } from 'lucide-react';
import type { DonDatHangStatsByTrangThai } from './useDonDatHangStats';
import type { StatsChartItem } from './useDonDatHangStats';

interface Props {
  byTrangThai: DonDatHangStatsByTrangThai[];
  bySupplier: StatsChartItem[];
  byBuyer: StatsChartItem[];
  byDanhMucCap1?: StatsChartItem[];
  byDanhMucCap2?: StatsChartItem[];
  byPhanLoai?: StatsChartItem[];
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
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('donDatHang.stats.itemNameCol')}</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t('donDatHang.stats.countCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
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

const StatsTables: React.FC<Props> = ({ byTrangThai, bySupplier, byBuyer, byDanhMucCap1, byDanhMucCap2, byPhanLoai }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-primary" />
              <h3 className="text-xs font-semibold text-foreground">{t('donDatHang.stats.byStatus')}</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('donDatHang.stats.nameCol')}</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('donDatHang.stats.countCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {byTrangThai.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                      {t('donDatHang.stats.noData')}
                    </td>
                  </tr>
                ) : (
                  byTrangThai.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 text-foreground">{t(`donDatHang.${row.ten}`)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <TableBlock
          titleKey="donDatHang.stats.bySupplier"
          icon={Building2}
          data={bySupplier}
          emptyMessageKey="donDatHang.stats.noData"
        />
        <TableBlock
          titleKey="donDatHang.stats.byBuyer"
          icon={User}
          data={byBuyer}
          emptyMessageKey="donDatHang.stats.noData"
        />
      </div>

      {(byDanhMucCap1 || byDanhMucCap2 || byPhanLoai) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TableBlock
            titleKey="donDatHang.stats.byDanhMucCap1"
            icon={FolderTree}
            data={byDanhMucCap1 ?? []}
            emptyMessageKey="donDatHang.stats.noData"
          />
          <TableBlock
            titleKey="donDatHang.stats.byDanhMucCap2"
            icon={Layers}
            data={byDanhMucCap2 ?? []}
            emptyMessageKey="donDatHang.stats.noData"
          />
          <TableBlock
            titleKey="donDatHang.stats.byPhanLoai"
            icon={Filter}
            data={byPhanLoai ?? []}
            emptyMessageKey="donDatHang.stats.noData"
          />
        </div>
      )}
    </div>
  );
};

export default StatsTables;
