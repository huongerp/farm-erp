import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  normalizeChiTietForDisplay,
  sumTongCongQuyDoiPhieu,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichTuChiTiet,
  sumTongGioTangCaTichPhieu,
} from '../core/types';
import {
  formatGioTbVN,
  sumDisplayLoaiTotalsOnRows,
  sumTongGioQuyDoiRowIVFromRows,
  tongGioCongNgayVaNua,
} from '../core/ct-sub';
import {
  bcncTableClass,
  bcncColChuyen,
  bcncColNum,
  bcncColTongGio,
  bcncColGhiChu,
  bcncThGroup,
  bcncThSub,
  bcncTdChuyen,
  bcncTdMainNum,
  bcncTdQuyDoi,
  bcncTdTongGio,
  bcncTdTongGioTc,
  bcncTdGhiChu,
} from '../core/bcnc-detail-table';
import { formatNumberVN } from '../../../../lib/utils';
import BaoCaoNhanCongDetailChuyenRow from './BaoCaoNhanCongDetailChuyenRow';

interface Props {
  data: FarmBaoCaoNhanCong;
}

/**
 * Bảng "Chuyền sản xuất" tái sử dụng — dùng cả trong BaoCaoNhanCongDetail
 * lẫn panel mở rộng trong BaoCaoSoCheDetail.
 */
const BaoCaoNhanCongChuyenTable: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();

  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);
  const ivQuyDoi = sumTongCongQuyDoiTuChiTiet(production);
  const tongQuyDoiPhieu = sumTongCongQuyDoiPhieu(data);
  const ivCnNgay = sumDisplayLoaiTotalsOnRows(production, 'CN_NGAY');
  const ivCnNua = sumDisplayLoaiTotalsOnRows(production, 'CN_NUA');
  const ivTangCa = sumDisplayLoaiTotalsOnRows(production, 'TANG_CA');
  const ivTongGioNgayNua = sumTongGioQuyDoiRowIVFromRows(production);
  const ivTongGioTc = sumTongGioTangCaTichTuChiTiet(production);
  const tongCnNgay = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NGAY');
  const tongCnNua = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NUA');
  const tongTangCa = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'TANG_CA');
  const tongTongGioNgayNua = tongGioCongNgayVaNua(tongCnNgay, tongCnNua);
  const tongTongGioTc = sumTongGioTangCaTichPhieu(data);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className={bcncTableClass}>
        <thead>
          <tr className="bg-muted/50 border-b border-border/60">
            <th rowSpan={2} className={`text-center px-2 py-2 font-medium w-14 align-middle border-b border-border ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colTt')}
            </th>
            <th rowSpan={2} className={`text-left px-2 py-2 font-medium align-middle border-b border-border ${bcncColChuyen} ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colChuyen')}
            </th>
            <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colSlNgay')}
            </th>
            <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colSlNua')}
            </th>
            <th rowSpan={2} className={`text-right px-2 py-2 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/15 align-middle border-b border-border ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colTongCongQuyDoi')}
            </th>
            <th rowSpan={2} className={`text-right px-2 py-1.5 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/12 align-middle border-b border-border ${bcncColTongGio} ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colTongGio')}
            </th>
            <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colSlTangCa')}
            </th>
            <th rowSpan={2} className={`text-right px-2 py-1.5 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/12 align-middle border-b border-border ${bcncColTongGio} ${bcncThGroup}`}>
              {t('baoCaoNhanCong.form.colTongGioTc')}
            </th>
            <th rowSpan={2} className={`text-left px-2 py-2 font-medium align-middle border-b border-border ${bcncColGhiChu}`}>
              {t('baoCaoNhanCong.form.colGhiChu')}
            </th>
          </tr>
          <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
            <th className={`text-right px-1 py-1 font-medium text-caption ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
            <th className={`text-right px-1 py-1 font-medium text-caption ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
            <th className={`text-right px-1 py-1 font-medium text-caption ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
            <th className={`text-right px-1 py-1 font-medium text-caption ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
            <th className={`text-right px-1 py-1 font-medium text-caption ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
            <th className={`text-right px-1 py-1 font-medium text-caption ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
          </tr>
        </thead>
        <tbody>
          {production.map((row, idx) => (
            <BaoCaoNhanCongDetailChuyenRow key={row.id || row.loai_chuyen} row={row} idx={idx} />
          ))}
          <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15 font-semibold">
            <td className={`${bcncTdMainNum} text-center text-primary`}>IV</td>
            <td className={`${bcncTdChuyen} text-primary`}>{t('baoCaoNhanCong.form.rowCongNhanDinhBien')}</td>
            <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivCnNgay.nhanSu)}</td>
            <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivCnNgay.nhanSu, ivCnNgay.tongGio)}</td>
            <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivCnNua.nhanSu)}</td>
            <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivCnNua.nhanSu, ivCnNua.tongGio)}</td>
            <td className={bcncTdQuyDoi}>{formatNumberVN(ivQuyDoi)}</td>
            <td className={bcncTdTongGio}>{formatNumberVN(ivTongGioNgayNua)}</td>
            <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivTangCa.nhanSu)}</td>
            <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivTangCa.nhanSu, ivTangCa.tongGio)}</td>
            <td className={bcncTdTongGioTc}>{formatNumberVN(ivTongGioTc)}</td>
            <td className={`${bcncTdGhiChu} text-muted-foreground text-sm font-normal`}>—</td>
          </tr>
          <BaoCaoNhanCongDetailChuyenRow row={vRow} tt="V" />
          <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0 font-semibold">
            <td className={`${bcncTdChuyen} text-left text-primary sm:pl-3 tracking-tight`} colSpan={2}>
              {t('baoCaoNhanCong.form.rowTongNgay')}
            </td>
            <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongCnNgay.nhanSu)}</td>
            <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongCnNgay.nhanSu, tongCnNgay.tongGio)}</td>
            <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongCnNua.nhanSu)}</td>
            <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongCnNua.nhanSu, tongCnNua.tongGio)}</td>
            <td className={`${bcncTdQuyDoi} text-base bg-primary/[0.1] dark:bg-primary/20`}>{formatNumberVN(tongQuyDoiPhieu)}</td>
            <td className={`${bcncTdTongGio} text-base`}>{formatNumberVN(tongTongGioNgayNua)}</td>
            <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongTangCa.nhanSu)}</td>
            <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongTangCa.nhanSu, tongTangCa.tongGio)}</td>
            <td className={`${bcncTdTongGioTc} text-base`}>{formatNumberVN(tongTongGioTc)}</td>
            <td className={`${bcncTdGhiChu} text-muted-foreground text-sm font-normal`}>—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BaoCaoNhanCongChuyenTable;
