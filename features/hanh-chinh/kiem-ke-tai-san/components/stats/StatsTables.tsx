import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import type { KiemKeStatsByTrangThai } from './useKiemKeStats';

interface Props {
  byTrangThai: KiemKeStatsByTrangThai[];
}

const StatsTables: React.FC<Props> = ({ byTrangThai }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            {t('kiemKeTaiSan.stats.byStatus')}
          </h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('kiemKeTaiSan.stats.nameCol')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('kiemKeTaiSan.stats.countCol')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {byTrangThai.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                  {t('kiemKeTaiSan.stats.noData')}
                </td>
              </tr>
            ) : (
              byTrangThai.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">
                    {row.ten}
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
  );
};

export default StatsTables;
