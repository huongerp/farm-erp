import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, MapPin, Tag } from 'lucide-react';
import type { StatsByGroup } from './useTaiSanStats';

interface Props {
  byNhom: StatsByGroup[];
  byNoiLuu: StatsByGroup[];
  byTrangThai: StatsByGroup[];
}

const StatsTables: React.FC<Props> = ({ byNhom, byNoiLuu, byTrangThai }) => {
  const { t } = useTranslation();

  const renderTable = (
    title: string,
    icon: React.ReactNode,
    data: StatsByGroup[],
    emptyKey: string
  ) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('danhSachTaiSan.stats.nameCol')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('danhSachTaiSan.stats.countCol')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                  {t(emptyKey)}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">{row.ten}</td>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {renderTable(
        t('danhSachTaiSan.stats.byGroup'),
        <Layers size={14} className="text-primary" />,
        byNhom,
        'danhSachTaiSan.stats.noData'
      )}
      {renderTable(
        t('danhSachTaiSan.stats.byLocation'),
        <MapPin size={14} className="text-primary" />,
        byNoiLuu,
        'danhSachTaiSan.stats.noData'
      )}
      {renderTable(
        t('danhSachTaiSan.stats.byStatus'),
        <Tag size={14} className="text-primary" />,
        byTrangThai,
        'danhSachTaiSan.stats.noData'
      )}
    </div>
  );
};

export default StatsTables;
