import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { useIsMobile } from '../../../../lib/hooks/use-is-mobile';

interface Props {
  data: FarmDuBaoSlDongThung;
}

/**
 * Bảng tính dự báo SL đóng thùng — tái sử dụng trong DuBaoSlDongThungDetail
 * và panel nhúng bên trong BaoCaoSoCheDetail.
 */
const DuBaoSlDongThungBangTinhTable: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const kpi = computeDuBaoSlDongThungKpiFromFarm(data);
  const isMobile = useIsMobile();

  const cellNum = (n: number | null, bold?: boolean) => (
    <span className={cn('tabular-nums text-sm', bold ? 'font-bold text-primary' : 'text-foreground')}>
      {n == null ? '—' : formatNumberVN(n)}
    </span>
  );

  const pct = (r: number) => `${formatNumberVN(Math.round(r * 10000) / 100)}%`;

  // 15 dòng chỉ số: desktop là bảng 5 cột như cũ, điện thoại (bảng 42rem phải vuốt ngang) là danh sách dọc.
  const dong: { stt: number; value: React.ReactNode; unit: string; nhan?: 'muted' | 'primary' | 'primaryStrong' }[] = [
    { stt: 1, value: cellNum(data.so_buong_can_mau), unit: 'unitBuong', nhan: undefined },
    { stt: 2, value: cellNum(data.tong_can_nang_mau), unit: 'unitKg', nhan: undefined },
    { stt: 3, value: cellNum(kpi.can_nang_binh_quan_buong), unit: 'unitKgPerBuong', nhan: 'muted' },
    { stt: 4, value: cellNum(data.tong_buong_nhap_ke_hoach), unit: 'unitBuong', nhan: undefined },
    { stt: 5, value: cellNum(kpi.tong_khoi_luong_ke_hoach), unit: 'unitKg', nhan: 'muted' },
    { stt: 6, value: pct(data.ty_le_thu_hoi_ke_hoach), unit: 'unitPercent', nhan: undefined },
    { stt: 7, value: cellNum(kpi.khoi_luong_dong_thung_ke_hoach), unit: 'unitKg', nhan: 'muted' },
    { stt: 8, value: cellNum(data.quy_cach_dong_thung_ke_hoach), unit: 'unitKgPerThung', nhan: undefined },
    { stt: 9, value: cellNum(kpi.tong_so_thung_ke_hoach, true), unit: 'unitThung', nhan: 'primary' },
    { stt: 10, value: cellNum(data.tong_buong_nhap_thuc_te), unit: 'unitBuong', nhan: undefined },
    { stt: 11, value: cellNum(kpi.tong_khoi_luong_thuc_te), unit: 'unitKg', nhan: 'muted' },
    { stt: 12, value: pct(data.ty_le_thu_hoi_thuc_te), unit: 'unitPercent', nhan: undefined },
    { stt: 13, value: cellNum(kpi.khoi_luong_dong_thung_thuc_te), unit: 'unitKg', nhan: 'muted' },
    { stt: 14, value: cellNum(data.quy_cach_dong_thung_thuc_te), unit: 'unitKgPerThung', nhan: undefined },
    { stt: 15, value: cellNum(kpi.tong_so_thung_thuc_te, true), unit: 'unitThung', nhan: 'primaryStrong' }
  ];
  const nhan = (stt: number) => t(`duBaoSlDongThung.form.row${stt}`);
  const ghiChu = (stt: number) => t(`duBaoSlDongThung.form.row${stt}Note`);
  const donVi = (unit: string) => t(`duBaoSlDongThung.form.${unit}`);

  if (isMobile) {
    return (
      <div className="rounded-lg border border-border divide-y divide-border/80">
        {dong.map((d) => {
          const noiBat = d.nhan === 'primary' || d.nhan === 'primaryStrong';
          return (
            <div key={d.stt} className={cn('px-3 py-2', noiBat && 'bg-primary/10 dark:bg-primary/15')}>
              <div className="flex items-baseline justify-between gap-3">
                <span className={cn('text-sm min-w-0', noiBat ? 'font-bold text-primary' : 'text-muted-foreground')}>
                  {d.stt}. {nhan(d.stt)}
                </span>
                <span className="shrink-0 text-right whitespace-nowrap">
                  {d.value}
                  <span className={cn('ml-1 text-xs', noiBat ? 'font-medium text-primary' : 'text-muted-foreground')}>{donVi(d.unit)}</span>
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{ghiChu(d.stt)}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm min-w-[42rem]">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-center px-2 py-2 font-medium w-12">{t('duBaoSlDongThung.form.colStt')}</th>
            <th className="text-left px-3 py-2 font-medium min-w-[12rem]">{t('duBaoSlDongThung.form.colHangMuc')}</th>
            <th className="text-right px-2 py-2 font-medium min-w-[8rem]">{t('duBaoSlDongThung.form.colGiaTri')}</th>
            <th className="text-left px-2 py-2 font-medium w-28">{t('duBaoSlDongThung.form.colDonVi')}</th>
            <th className="text-left px-2 py-2 font-medium min-w-[14rem]">{t('duBaoSlDongThung.form.colGhiChu')}</th>
          </tr>
        </thead>
        <tbody>
          {dong.map((d) => {
            const noiBat = d.nhan === 'primary' || d.nhan === 'primaryStrong';
            return (
              <tr
                key={d.stt}
                className={cn(
                  'border-b border-border/80',
                  d.nhan === 'muted' && 'bg-muted/20',
                  d.nhan === 'primary' && 'bg-primary/10 dark:bg-primary/15',
                  d.nhan === 'primaryStrong' && 'bg-primary/15 dark:bg-primary/20 last:border-0'
                )}
              >
                <td className={cn('px-2 py-2 text-center tabular-nums', noiBat && 'font-bold text-primary')}>{d.stt}</td>
                <td className={cn('px-3 py-2', noiBat ? 'font-bold text-primary' : 'text-muted-foreground')}>{nhan(d.stt)}</td>
                <td className="px-2 py-2 text-right">{d.value}</td>
                <td className={cn('px-2 py-2', noiBat ? 'font-medium text-primary' : 'text-muted-foreground')}>{donVi(d.unit)}</td>
                <td className="px-2 py-2 text-xs text-muted-foreground">{ghiChu(d.stt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DuBaoSlDongThungBangTinhTable;
