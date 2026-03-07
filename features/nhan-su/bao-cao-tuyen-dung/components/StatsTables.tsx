import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Share2 } from 'lucide-react';
import type { ByViTriRow, ByNguonRow } from '../hooks/useBaoCaoTuyenDungStats';

interface Props {
  byViTri: ByViTriRow[];
  byNguon: ByNguonRow[];
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

const StatsTables: React.FC<Props> = ({ byViTri, byNguon }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TableBlock
        title={t('baoCaoTuyenDung.tableByViTri')}
        titleIcon={Briefcase}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('baoCaoTuyenDung.tableViTri')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoTuyenDung.tableSoUngVien')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoTuyenDung.tableSoPV')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoTuyenDung.tableSoThuMoi')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoTuyenDung.tableSoHopDong')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {byViTri.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  {t('baoCaoTuyenDung.noData')}
                </td>
              </tr>
            ) : (
              byViTri.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground truncate max-w-[180px]" title={row.label}>
                    {row.label}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_ung_vien}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_pv}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_thu_moi}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_hop_dong}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableBlock>

      <TableBlock
        title={t('baoCaoTuyenDung.tableByNguon')}
        titleIcon={Share2}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                {t('baoCaoTuyenDung.tableNguon')}
              </th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                {t('baoCaoTuyenDung.tableSoUngVien')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {byNguon.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                  {t('baoCaoTuyenDung.noData')}
                </td>
              </tr>
            ) : (
              byNguon.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">{row.label || row.id}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{row.so_ung_vien}</td>
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
