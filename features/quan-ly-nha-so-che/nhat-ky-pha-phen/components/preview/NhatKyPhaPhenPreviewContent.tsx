/** Nội dung MỘT liên phiếu in nhật ký pha phèn — A4 dọc, khung chuẩn hệ thống (PhieuInParts). */
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
import type { NhatKyPhaPhen } from '../../core/types';
import { formatChenhLech, formatKg } from '../../utils/hien-thi';

interface Props {
  phieu: NhatKyPhaPhen;
}

/** Số từ DB có thể là chuỗi / null / '' — không ép `Number('')` thành 0. */
function soHoacNull(x: unknown): number | null {
  if (x == null || x === '') return null;
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

/** Chênh lệch làm tròn 3 số lẻ (tránh 0,30000000004); thiếu một vế → «—». */
function chenhLech(thucTe: unknown, dinhMuc: unknown): string {
  const a = soHoacNull(thucTe);
  const b = soHoacNull(dinhMuc);
  if (a == null || b == null) return '—';
  return formatChenhLech(Math.round((a - b) * 1000) / 1000);
}

const NhatKyPhaPhenPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const chenhLechTong = soHoacNull(phieu.chenh_lech);

  const thongTin: [string, React.ReactNode][] = [
    [t('nkpp.preview.nhaSoChe'), phieu.ten_chi_nhanh],
    [t('nkpp.col.ngay'), formatYmdToDisplay(phieu.ngay)],
    [t('nkpp.col.nhanSu'), phieu.ten_nhan_vien_phu_trach],
    [t('nkpp.col.soBuongDuThu'), phieu.so_buong_du_thu != null ? String(phieu.so_buong_du_thu) : null],
    [t('nkpp.col.soBeSoChe'), phieu.so_be_so_che != null ? String(phieu.so_be_so_che) : null],
  ];

  const th = cn(TH_IN, 'px-2 py-1');
  const td = cn(TD_IN, 'px-2 py-1');
  const tdSo = cn(td, 'text-right tabular-nums');

  return (
    <KhungPhieu
      title={t('nkpp.preview.title')}
      subtitle={phieu.ten_chi_nhanh ?? undefined}
      ngay={formatYmdToDisplay(phieu.ngay)}
    >
      <TieuDeMuc>{t('nkpp.preview.thongTin')}</TieuDeMuc>
      <BangThongTin rows={thongTin} />

      <TieuDeMuc>{t('nkpp.preview.cacLanPha')}</TieuDeMuc>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(th, 'text-center w-[10%]')}>{t('nkpp.preview.colLan')}</th>
            <th className={cn(th, 'text-center w-[14%]')}>{t('nkpp.preview.colGio')}</th>
            <th className={cn(th, 'text-right')}>{t('nkpp.preview.colSoKg')}</th>
            <th className={cn(th, 'text-right')}>{t('nkpp.preview.colDinhMuc')}</th>
            <th className={cn(th, 'text-right')}>{t('nkpp.preview.colChenhLech')}</th>
          </tr>
        </thead>
        <tbody>
          {phieu.lan.length === 0 ? (
            <tr>
              <td colSpan={5} className={cn(td, 'text-center italic text-gray-500')}>
                {t('nkpp.preview.chuaCoLanPha')}
              </td>
            </tr>
          ) : (
            phieu.lan.map((l) => (
              <tr key={l.lan}>
                <td className={cn(td, 'text-center tabular-nums')}>{l.lan}</td>
                <td className={cn(td, 'text-center tabular-nums')}>{l.gio || '—'}</td>
                <td className={tdSo}>{formatKg(soHoacNull(l.so_kg))}</td>
                <td className={tdSo}>{formatKg(soHoacNull(l.dinh_muc_kg))}</td>
                <td className={tdSo}>{chenhLech(l.so_kg, l.dinh_muc_kg)}</td>
              </tr>
            ))
          )}
          <tr className="bg-gray-100 font-semibold">
            <td colSpan={2} className={cn(td, 'text-center uppercase')}>
              {t('nkpp.preview.tong')}
            </td>
            <td className={tdSo}>{formatKg(soHoacNull(phieu.tong_thuc_te))}</td>
            <td className={tdSo}>{formatKg(soHoacNull(phieu.tong_dinh_muc))}</td>
            <td className={tdSo}>{chenhLechTong == null ? '—' : formatChenhLech(chenhLechTong)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-2 whitespace-pre-line break-inside-avoid">
        <span className="font-semibold">{t('nkpp.col.ghiChu')}:</span> {phieu.ghi_chu || '—'}
      </p>

      <HangKyTen
        className="mt-auto pt-2"
        labels={[
          { label: t('nkpp.preview.nguoiLap'), ten: phieu.ten_nguoi_tao },
          { label: t('nkpp.col.nhanSu'), ten: phieu.ten_nhan_vien_phu_trach },
        ]}
      />
    </KhungPhieu>
  );
};

export default NhatKyPhaPhenPreviewContent;
