/** Nội dung MỘT liên phiếu in nhật ký pha thuốc phun cùi — A4 dọc (A4 ngang đẩy khối ký sang trang 2), khung chuẩn hệ thống. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
  TieuDeMuc,
} from '../../../../../components/shared/phieu-in/PhieuInParts';
import { cn, formatYmdToDisplay } from '../../../../../lib/utils';
import { donViLuongThuoc } from '../../core/constants';
import { formatSo } from '../../core/so';
import { tongNuocLit } from '../../core/tong-hop';
import type { NhatKyPhunCui } from '../../core/types';

interface Props {
  phieu: NhatKyPhunCui;
}

const NhatKyPhunCuiPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();

  const thongTin: [string, React.ReactNode][] = [
    [t('nkpc.preview.nhaSoChe'), phieu.ten_chi_nhanh],
    [t('nkpc.col.ngay'), formatYmdToDisplay(phieu.ngay)],
    [t('nkpc.col.nhanSu'), phieu.ten_nhan_vien_phu_trach],
  ];

  const th = cn(TH_IN, 'px-2 py-1');
  const td = cn(TD_IN, 'px-2 py-1');
  const tdSo = cn(td, 'text-right tabular-nums whitespace-nowrap');

  return (
    <KhungPhieu
      title={t('nkpc.preview.title')}
      subtitle={phieu.ten_chi_nhanh ?? undefined}
      ngay={formatYmdToDisplay(phieu.ngay)}
    >
      <TieuDeMuc>{t('nkpc.preview.thongTin')}</TieuDeMuc>
      <BangThongTin rows={thongTin} />

      <TieuDeMuc>{t('nkpc.preview.cacLanPha')}</TieuDeMuc>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(th, 'text-center w-[6%]')}>{t('nkpc.preview.colStt')}</th>
            <th className={cn(th, 'text-center w-[8%]')}>{t('nkpc.preview.colGio')}</th>
            <th className={cn(th, 'text-left')}>{t('nkpc.preview.colThuoc')}</th>
            <th className={cn(th, 'text-right')}>{t('nkpc.preview.colNongDo')}</th>
            <th className={cn(th, 'text-right')}>{t('nkpc.preview.colLuongNuoc')}</th>
            <th className={cn(th, 'text-right')}>{t('nkpc.preview.colLuongThuoc')}</th>
            <th className={cn(th, 'text-left w-[20%]')}>{t('nkpc.preview.colGhiChu')}</th>
          </tr>
        </thead>
        <tbody>
          {phieu.lan.length === 0 ? (
            <tr>
              <td colSpan={7} className={cn(td, 'text-center italic text-gray-500')}>
                {t('nkpc.preview.chuaCoLanPha')}
              </td>
            </tr>
          ) : (
            phieu.lan.map((l, i) => (
              <tr key={l.id}>
                <td className={cn(td, 'text-center tabular-nums')}>{l.thu_tu || i + 1}</td>
                <td className={cn(td, 'text-center tabular-nums')}>{l.gio || '—'}</td>
                <td className={td}>
                  {l.ma_hang_hoa ? `${l.ma_hang_hoa} - ` : ''}
                  {l.ten_hang_hoa || '—'}
                </td>
                <td className={tdSo}>{l.nong_do != null ? `${formatSo(l.nong_do)} ${l.don_vi}` : '—'}</td>
                <td className={tdSo}>{l.luong_nuoc_lit != null ? formatSo(l.luong_nuoc_lit) : '—'}</td>
                <td className={tdSo}>
                  {l.luong_thuoc != null ? `${formatSo(l.luong_thuoc)} ${donViLuongThuoc(l.don_vi)}` : '—'}
                </td>
                <td className={cn(td, 'whitespace-pre-line')}>{l.ghi_chu || '—'}</td>
              </tr>
            ))
          )}
          {phieu.lan.length > 0 && (
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={4} className={cn(td, 'text-center uppercase')}>
                {t('nkpc.preview.tongNuoc')}
              </td>
              <td className={tdSo}>{formatSo(tongNuocLit(phieu.lan))}</td>
              <td className={td} />
              <td className={td} />
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-2 whitespace-pre-line break-inside-avoid">
        <span className="font-semibold">{t('nkpc.col.ghiChu')}:</span> {phieu.ghi_chu || '—'}
      </p>

      <HangKyTen
        className="mt-auto pt-2"
        labels={[
          { label: t('nkpc.preview.nguoiLap'), ten: phieu.ten_nguoi_tao },
          { label: t('nkpc.col.nhanSu'), ten: phieu.ten_nhan_vien_phu_trach },
        ]}
      />
    </KhungPhieu>
  );
};

export default NhatKyPhunCuiPreviewContent;
