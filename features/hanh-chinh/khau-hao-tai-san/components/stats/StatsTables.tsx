import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/utils';
import type { KhauHaoStatsByNhom } from './useKhauHaoStats';

interface Props {
  byNhom: KhauHaoStatsByNhom[];
}

const StatsTables: React.FC<Props> = ({ byNhom }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            {t('khauHaoTaiSan.stats.byGroup')}
          </h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('khauHaoTaiSan.stats.nameCol')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('khauHaoTaiSan.stats.countCol')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('khauHaoTaiSan.detail.nguyenGiaCol')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('khauHaoTaiSan.detail.khauHaoLuyKeCol')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('khauHaoTaiSan.detail.giaTriCuoiKyCol')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {byNhom.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  {t('khauHaoTaiSan.stats.noData')}
                </td>
              </tr>
            ) : (
              byNhom.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">{row.tenNhom}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {row.count}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(row.nguyenGia)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(row.khauHaoLuyKe)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(row.giaTriConLai)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsTables;
