import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import { cn, formatNumberVN } from '../../../../lib/utils';

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

  const cellNum = (n: number | null, bold?: boolean) => (
    <span className={cn('tabular-nums text-sm', bold ? 'font-bold text-primary' : 'text-foreground')}>
      {n == null ? '—' : formatNumberVN(n)}
    </span>
  );

  const pct = (r: number) => `${formatNumberVN(Math.round(r * 10000) / 100)}%`;

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
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">1</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row1')}</td>
            <td className="px-2 py-2 text-right">{cellNum(data.so_buong_can_mau)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row1Note')}</td>
          </tr>
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">2</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row2')}</td>
            <td className="px-2 py-2 text-right">{cellNum(data.tong_can_nang_mau)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row2Note')}</td>
          </tr>
          <tr className="border-b border-border/80 bg-muted/20">
            <td className="px-2 py-2 text-center tabular-nums">3</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row3')}</td>
            <td className="px-2 py-2 text-right">{cellNum(kpi.can_nang_binh_quan_buong)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerBuong')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row3Note')}</td>
          </tr>
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">4</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row4')}</td>
            <td className="px-2 py-2 text-right">{cellNum(data.tong_buong_nhap_ke_hoach)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row4Note')}</td>
          </tr>
          <tr className="border-b border-border/80 bg-muted/20">
            <td className="px-2 py-2 text-center tabular-nums">5</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row5')}</td>
            <td className="px-2 py-2 text-right">{cellNum(kpi.tong_khoi_luong_ke_hoach)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row5Note')}</td>
          </tr>
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">6</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row6')}</td>
            <td className="px-2 py-2 text-right">{pct(data.ty_le_thu_hoi_ke_hoach)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitPercent')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row6Note')}</td>
          </tr>
          <tr className="border-b border-border/80 bg-muted/20">
            <td className="px-2 py-2 text-center tabular-nums">7</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row7')}</td>
            <td className="px-2 py-2 text-right">{cellNum(kpi.khoi_luong_dong_thung_ke_hoach)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row7Note')}</td>
          </tr>
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">8</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row8')}</td>
            <td className="px-2 py-2 text-right">{cellNum(data.quy_cach_dong_thung_ke_hoach)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerThung')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row8Note')}</td>
          </tr>
          <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15">
            <td className="px-2 py-2 text-center font-bold text-primary tabular-nums">9</td>
            <td className="px-3 py-2 font-bold text-primary">{t('duBaoSlDongThung.form.row9')}</td>
            <td className="px-2 py-2 text-right">{cellNum(kpi.tong_so_thung_ke_hoach, true)}</td>
            <td className="px-2 py-2 font-medium text-primary">{t('duBaoSlDongThung.form.unitThung')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row9Note')}</td>
          </tr>
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">10</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row10')}</td>
            <td className="px-2 py-2 text-right">{cellNum(data.tong_buong_nhap_thuc_te)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row10Note')}</td>
          </tr>
          <tr className="border-b border-border/80 bg-muted/20">
            <td className="px-2 py-2 text-center tabular-nums">11</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row11')}</td>
            <td className="px-2 py-2 text-right">{cellNum(kpi.tong_khoi_luong_thuc_te)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row11Note')}</td>
          </tr>
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">12</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row12')}</td>
            <td className="px-2 py-2 text-right">{pct(data.ty_le_thu_hoi_thuc_te)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitPercent')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row12Note')}</td>
          </tr>
          <tr className="border-b border-border/80 bg-muted/20">
            <td className="px-2 py-2 text-center tabular-nums">13</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row13')}</td>
            <td className="px-2 py-2 text-right">{cellNum(kpi.khoi_luong_dong_thung_thuc_te)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row13Note')}</td>
          </tr>
          <tr className="border-b border-border/80">
            <td className="px-2 py-2 text-center tabular-nums">14</td>
            <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row14')}</td>
            <td className="px-2 py-2 text-right">{cellNum(data.quy_cach_dong_thung_thuc_te)}</td>
            <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerThung')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row14Note')}</td>
          </tr>
          <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0">
            <td className="px-2 py-2 text-center font-bold text-primary tabular-nums">15</td>
            <td className="px-3 py-2 font-bold text-primary">{t('duBaoSlDongThung.form.row15')}</td>
            <td className="px-2 py-2 text-right">{cellNum(kpi.tong_so_thung_thuc_te, true)}</td>
            <td className="px-2 py-2 font-medium text-primary">{t('duBaoSlDongThung.form.unitThung')}</td>
            <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row15Note')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DuBaoSlDongThungBangTinhTable;
