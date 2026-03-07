import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Package } from 'lucide-react';
import type { TonKhoStats } from './useTonKhoStats';

interface Props {
  byWarehouse: TonKhoStats['byWarehouse'];
  topProducts: TonKhoStats['topProducts'];
}

const StatsTables: React.FC<Props> = ({ byWarehouse, topProducts }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('tonKho.stats.byWarehouse')}
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/95 z-[1]">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  {t('tonKho.stats.warehouseCol')}
                </th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                  {t('tonKho.stats.qtyCol')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
              {byWarehouse.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    {t('tonKho.stats.noData')}
                  </td>
                </tr>
              ) : (
                byWarehouse.map((row, idx) => (
                  <tr key={row.name} className="hover:bg-muted/20">
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2 text-foreground font-medium">{row.name}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {row.value.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('tonKho.stats.topProducts')}
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/95 z-[1]">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  {t('tonKho.stats.productCol')}
                </th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                  {t('tonKho.stats.qtyCol')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    {t('tonKho.stats.noData')}
                  </td>
                </tr>
              ) : (
                topProducts.map((row, idx) => (
                  <tr key={`${row.name}-${idx}`} className="hover:bg-muted/20">
                    <td className="px-4 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2 text-foreground font-medium truncate max-w-[200px]" title={row.name}>
                      {row.name}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {row.value.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsTables;
