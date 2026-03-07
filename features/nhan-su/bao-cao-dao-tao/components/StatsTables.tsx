import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import type { ByKhoaRow } from '../hooks/useBaoCaoDaoTaoStats';

interface Props {
  byKhoa: ByKhoaRow[];
}

const TableBlock: React.FC<{
  title: string;
  titleIcon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, titleIcon: TitleIcon, children }) => (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <div className="px-4 py-2.5 border-b border-border">
      <div className="flex items-center gap-2">
        <TitleIcon size={14} className="text-primary" />
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const StatsTables: React.FC<Props> = ({ byKhoa }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4">
      <TableBlock
        title={t('baoCaoDaoTao.tableByKhoa')}
        titleIcon={BookOpen}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('baoCaoDaoTao.tableKhoa')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoDaoTao.tableSoDangKy')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoDaoTao.tableSoDangHoc')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoDaoTao.tableSoHoanThanh')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoDaoTao.tableTyLe')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {byKhoa.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  {t('baoCaoDaoTao.noData')}
                </td>
              </tr>
            ) : (
              byKhoa.map((row) => (
                <tr key={row.id_khoa_hoc} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground truncate max-w-[220px]" title={`${row.ma_khoa_hoc} - ${row.ten_khoa_hoc}`}>
                    {row.ma_khoa_hoc} · {row.ten_khoa_hoc}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_dang_ky}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_dang_hoc}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_hoan_thanh}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.ty_le_hoan_thanh.toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableBlock>
    </div>
  );
};

export default StatsTables;
