import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, Package, MapPin, Truck } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/utils';
import type { NhomThongKe } from '../../core/thong-ke';

interface Props {
  byHangMuc: NhomThongKe[];
  byChiNhanh: NhomThongKe[];
  byNhaCungCap: NhomThongKe[];
  byTaiSan: NhomThongKe[];
}

const StatsTables: React.FC<Props> = ({ byHangMuc, byChiNhanh, byNhaCungCap, byTaiSan }) => {
  const { t } = useTranslation();

  const renderTable = (title: string, icon: React.ReactNode, rows: NhomThongKe[]) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">{t('baoTriSuaChua.stats.nameCol')}</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('baoTriSuaChua.stats.countCol')}</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">{t('baoTriSuaChua.stats.amountCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  {t('baoTriSuaChua.stats.noData')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id || '__trong'} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">{row.ten}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.soPhieu.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatCurrency(row.tongTien)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {renderTable(t('baoTriSuaChua.stats.byHangMuc'), <Wrench size={14} className="text-primary" />, byHangMuc)}
      {renderTable(t('baoTriSuaChua.stats.byChiNhanh'), <MapPin size={14} className="text-primary" />, byChiNhanh)}
      {renderTable(t('baoTriSuaChua.stats.byNhaCungCap'), <Truck size={14} className="text-primary" />, byNhaCungCap)}
      {renderTable(t('baoTriSuaChua.stats.byTaiSan'), <Package size={14} className="text-primary" />, byTaiSan)}
    </div>
  );
};

export default StatsTables;
