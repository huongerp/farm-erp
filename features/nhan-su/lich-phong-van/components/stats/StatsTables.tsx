import React from 'react';
import { useTranslation } from 'react-i18next';
import { CircleDot, Video, ClipboardCheck } from 'lucide-react';
import type { StatsRow } from './useLichPhongVanStats';

interface Props {
  byTrangThai: StatsRow[];
  byHinhThuc: StatsRow[];
  byTrangThaiDanhGia: StatsRow[];
}

const TableBlock: React.FC<{
  title: string;
  titleIcon: React.ElementType;
  rows: StatsRow[];
}> = ({ title, titleIcon: TitleIcon, rows }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <TitleIcon size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('lichPhongVan.stats.nameCol')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('lichPhongVan.stats.countCol')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                  {t('lichPhongVan.stats.noData')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">{t(row.labelKey)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatsTables: React.FC<Props> = ({ byTrangThai, byHinhThuc, byTrangThaiDanhGia }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TableBlock
        title={t('lichPhongVan.stats.byTrangThai')}
        titleIcon={CircleDot}
        rows={byTrangThai}
      />
      <TableBlock
        title={t('lichPhongVan.stats.byHinhThuc')}
        titleIcon={Video}
        rows={byHinhThuc}
      />
      <TableBlock
        title={t('lichPhongVan.stats.byTrangThaiDanhGia')}
        titleIcon={ClipboardCheck}
        rows={byTrangThaiDanhGia}
      />
    </div>
  );
};

export default StatsTables;
