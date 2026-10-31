/**
 * Danh sách tên theo chuyền (giống tờ chấm công giấy) — dùng ở chi tiết phiếu và trang in.
 * Phiếu không có tên nào thì không render.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCong } from '../core/types';
import { chuyenTtLabelByThuTu, normalizeChiTietForDisplay } from '../core/types';
import { formatNumberVN } from '../../../../lib/utils';

interface Props {
  data: FarmBaoCaoNhanCong;
  variant?: 'screen' | 'print';
}

const LOP = {
  screen: {
    wrap: 'overflow-x-auto rounded-lg border border-border',
    table: 'w-full text-sm border-collapse',
    th: 'px-2 py-1.5 text-left font-medium text-muted-foreground bg-muted/50 border-b border-border',
    group: 'px-2 py-1.5 font-semibold text-primary bg-primary/[0.06] border-b border-border/60',
    td: 'px-2 py-1.5 border-b border-border/40',
    total: 'px-2 py-1.5 font-semibold text-primary bg-primary/10',
  },
  print: {
    wrap: '',
    table: 'w-full border-collapse',
    th: 'border border-gray-400 px-1 py-0.5 text-[8pt] font-semibold text-gray-700 bg-gray-50 text-left',
    group: 'border border-gray-300 px-1 py-0.5 text-[8pt] font-semibold bg-gray-100',
    td: 'border border-gray-300 px-1 py-0.5 text-[8pt]',
    total: 'border border-gray-400 px-1 py-0.5 text-[8pt] font-bold',
  },
} as const;

const BaoCaoNhanCongNhanVienBang: React.FC<Props> = ({ data, variant = 'screen' }) => {
  const { t } = useTranslation();
  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);
  const nhom = [
    ...production.map((ct, i) => ({ ct, tt: chuyenTtLabelByThuTu(i + 1) })),
    { ct: vRow, tt: 'V' },
  ].filter(({ ct }) => (ct.nhan_vien?.length ?? 0) > 0);
  if (nhom.length === 0) return null;

  const c = LOP[variant];
  const num = `${c.td} text-right tabular-nums`;
  const tong = nhom.reduce((s, { ct }) => s + (ct.nhan_vien?.length ?? 0), 0);
  let stt = 0;

  return (
    <div className={c.wrap}>
      <table className={c.table}>
        <thead>
          <tr>
            <th className={`${c.th} w-10 text-center`}>{t('baoCaoNhanCong.nv.stt')}</th>
            <th className={c.th}>{t('baoCaoNhanCong.nv.hoTen')}</th>
            <th className={c.th}>{t('baoCaoNhanCong.nv.viTri')}</th>
            <th className={c.th}>{t('baoCaoNhanCong.nv.cong')}</th>
            <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nv.gioCong')}</th>
            <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nv.gioTc')}</th>
            <th className={c.th}>{t('baoCaoNhanCong.form.colGhiChu')}</th>
          </tr>
        </thead>
        <tbody>
          {nhom.map(({ ct, tt }) => (
            <React.Fragment key={ct.loai_chuyen}>
              <tr>
                <td colSpan={7} className={c.group}>
                  {tt}. {t(`baoCaoNhanCong.chuyen.${ct.loai_chuyen}`)} — {t('baoCaoNhanCong.nv.soNguoi', { n: ct.nhan_vien!.length })}
                </td>
              </tr>
              {ct.nhan_vien!.map((nv) => {
                stt += 1;
                return (
                  <tr key={nv.id}>
                    <td className={`${c.td} text-center tabular-nums`}>{stt}</td>
                    <td className={c.td}>{nv.ho_ten}</td>
                    <td className={c.td}>{nv.vi_tri ?? '—'}</td>
                    <td className={c.td}>{t(`baoCaoNhanCong.nv.chamCong.${nv.cham_cong}`)}</td>
                    <td className={num}>{formatNumberVN(nv.so_gio_cong)}</td>
                    <td className={num}>{nv.so_gio_tc > 0 ? formatNumberVN(nv.so_gio_tc) : '—'}</td>
                    <td className={c.td}>{nv.ghi_chu ?? ''}</td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
          <tr>
            <td colSpan={7} className={c.total}>
              {t('baoCaoNhanCong.nv.tongNguoi', { n: tong })}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BaoCaoNhanCongNhanVienBang;
