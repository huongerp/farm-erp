import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import type { FarmThongKe, TheoNgayThongKe } from '../../core/thong-ke';

interface Props {
  theoNgay: TheoNgayThongKe[];
  farms: FarmThongKe[];
}

/** Bảng ngày × farm: hàng = ngày, cột = từng farm, ô = số phiếu (kèm "x KĐ" khi có không đạt). */
const BangNgayFarm: React.FC<Props> = ({ theoNgay, farms }) => {
  const { t } = useTranslation();

  const tongFarm = farms.map((f) => theoNgay.reduce((s, d) => s + (d.theoFarm[f.id]?.tong ?? 0), 0));
  const tongTatCa = tongFarm.reduce((a, b) => a + b, 0);
  const kdNgan = t('giamSatChatLuong.thongKe.khongDatNgan');

  const header = (
    <thead className="sticky top-0 z-20">
      <tr className="text-muted-foreground border-b border-border">
        <th className="px-3 py-2 font-medium text-left sticky left-0 bg-card z-30 whitespace-nowrap">
          {t('giamSatChatLuong.thongKe.colNgay')}
        </th>
        {farms.map((f) => (
          <th key={f.id} className="px-3 py-2 font-medium text-right whitespace-nowrap bg-card">
            {f.ten}
          </th>
        ))}
        <th className="px-3 py-2 font-medium text-right whitespace-nowrap bg-card">
          {t('giamSatChatLuong.thongKe.tong')}
        </th>
      </tr>
    </thead>
  );

  const tongRow = (sticky: boolean) => (
    <tr className="border-b border-border font-medium bg-muted/40">
      <td className={cn('px-3 py-2 whitespace-nowrap', sticky && 'sticky left-0 bg-muted z-10')}>
        {t('giamSatChatLuong.thongKe.tong')}
      </td>
      {farms.map((f, i) => (
        <td key={f.id} className="px-3 py-2 text-right tabular-nums">
          {formatNumberVN(tongFarm[i])}
        </td>
      ))}
      <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatNumberVN(tongTatCa)}</td>
    </tr>
  );

  if (farms.length === 0 || theoNgay.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <CalendarDays size={18} className="text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground text-sm">{t('giamSatChatLuong.thongKe.bangNgayFarm')}</span>
        </div>
        <p className="text-sm text-muted-foreground p-4">{t('giamSatChatLuong.thongKe.empty')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <CalendarDays size={18} className="text-muted-foreground shrink-0" />
        <span className="font-medium text-foreground text-sm">{t('giamSatChatLuong.thongKe.bangNgayFarm')}</span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{theoNgay.length}</span>
      </div>
      <div className="overflow-auto max-h-[360px]">
        <table className="w-full text-sm">
          {header}
          <tbody>
            {tongRow(true)}
            {theoNgay.map((d) => (
              <tr key={d.ngay} className="border-b border-border/50">
                <td className="px-3 py-2 sticky left-0 bg-card z-10 whitespace-nowrap tabular-nums">
                  {formatYmdToDisplay(d.ngay)}
                </td>
                {farms.map((f) => {
                  const c = d.theoFarm[f.id];
                  return (
                    <td key={f.id} className="px-3 py-2 text-right tabular-nums">
                      {c ? (
                        <div className="leading-snug">
                          <div>{formatNumberVN(c.tong)}</div>
                          {c.khongDat > 0 && (
                            <div className="text-xs text-rose-600 dark:text-rose-400">
                              {c.khongDat} {kdNgan}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right tabular-nums font-medium">
                  <div className="leading-snug">
                    <div>{formatNumberVN(d.tong)}</div>
                    {d.khongDat > 0 && (
                      <div className="text-xs text-rose-600 dark:text-rose-400">
                        {d.khongDat} {kdNgan}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {tongRow(true)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BangNgayFarm;
