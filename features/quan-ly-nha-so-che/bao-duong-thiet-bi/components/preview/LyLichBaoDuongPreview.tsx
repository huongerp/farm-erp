/**
 * Nội dung "Lý lịch bảo dưỡng thiết bị" — A4 dọc: thông tin thiết bị, danh mục việc định kỳ,
 * 50 lần ghi nhận gần nhất và hàng chữ ký. Dùng màu biểu mẫu (xanh) như các phiếu in khác.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TieuDeMuc,
} from '../../../../../components/shared/phieu-in/PhieuInParts';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../../lib/utils';
import type { NhatKyBaoDuong, ThietBi, ViecBaoDuong } from '../../core/types';
import { tinhTrangHanLabel } from '../../components/Badges';

interface Props {
  thietBi: ThietBi;
  viec: ViecBaoDuong[];
  nhatKy: NhatKyBaoDuong[];
  taiSan: { ma_tai_san: string; ten_tai_san: string } | null;
  nhanVien: { id: string; ho_ten: string }[];
}

const TH = 'border border-gray-400 px-1.5 py-0.5 font-semibold text-center align-middle';
const TD = 'border border-gray-300 px-1.5 py-0.5 align-top';
const NEN_DAU = { background: '#3B6939', color: '#fff' } as const;

/** Số lần ghi nhận in ra — mới nhất trước. */
const SO_NHAT_KY_IN = 50;

const LyLichBaoDuongPreview: React.FC<Props> = ({ thietBi, viec, nhatKy, taiSan, nhanVien }) => {
  const { t } = useTranslation();
  const homNay = getTodayISO();

  const viecSorted = useMemo(() => [...viec].sort((a, b) => a.thu_tu - b.thu_tu || a.noi_dung.localeCompare(b.noi_dung, 'vi')), [viec]);

  const tenNguoi = useMemo(() => new Map(nhanVien.map((n) => [n.id, n.ho_ten])), [nhanVien]);

  const nhatKyIn = useMemo(() => {
    const viecTen = new Map(viec.map((v) => [v.id, v.noi_dung]));
    return [...nhatKy]
      .sort((a, b) => b.ngay_thuc_hien.localeCompare(a.ngay_thuc_hien) || b.id.localeCompare(a.id))
      .slice(0, SO_NHAT_KY_IN)
      .map((n) => ({
        ...n,
        viec_ten: viecTen.get(n.id_viec) ?? '—',
        nguoi_ten: n.id_nguoi_thuc_hien ? (tenNguoi.get(n.id_nguoi_thuc_hien) ?? null) : null,
      }));
  }, [nhatKy, viec, tenNguoi]);

  const thongTin: [string, React.ReactNode][] = [
    [t('baoDuongThietBi.thietBi.form.ten'), thietBi.ten],
    [t('baoDuongThietBi.col.maTs'), thietBi.ma_ts || '—'],
    [t('baoDuongThietBi.col.soLuong'), thietBi.so_luong || '—'],
    [t('baoDuongThietBi.col.khuVuc'), thietBi.khu_vuc || '—'],
    [
      t('baoDuongThietBi.col.taiSan'),
      taiSan ? `${taiSan.ma_tai_san} — ${taiSan.ten_tai_san}` : '—',
    ],
    [
      t('baoDuongThietBi.col.dangDung'),
      thietBi.dang_dung ? t('baoDuongThietBi.thietBi.dangDung') : t('baoDuongThietBi.thietBi.ngungDung'),
    ],
  ];
  if (thietBi.ghi_chu) thongTin.push([t('baoDuongThietBi.thietBi.form.ghiChu'), thietBi.ghi_chu]);

  return (
    <KhungPhieu
      title={t('baoDuongThietBi.preview.lyLichTitle').toUpperCase()}
      subtitle={[thietBi.ma_ts, thietBi.khu_vuc].filter(Boolean).join(' · ') || undefined}
    >
      <TieuDeMuc>{t('baoDuongThietBi.preview.thongTin')}</TieuDeMuc>
      <BangThongTin rows={thongTin} />

      <TieuDeMuc>{t('baoDuongThietBi.preview.viecTieuDe')}</TieuDeMuc>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(TH, 'w-8')} style={NEN_DAU}>#</th>
            <th className={TH} style={NEN_DAU}>{t('baoDuongThietBi.col.viec')}</th>
            <th className={TH} style={NEN_DAU}>{t('baoDuongThietBi.col.chuKy')}</th>
            <th className={TH} style={NEN_DAU}>{t('baoDuongThietBi.col.lanGanNhat')}</th>
            <th className={TH} style={NEN_DAU}>{t('baoDuongThietBi.col.hanKeTiep')}</th>
            <th className={TH} style={NEN_DAU}>{t('baoDuongThietBi.col.tinhTrang')}</th>
          </tr>
        </thead>
        <tbody>
          {viecSorted.length === 0 ? (
            <tr>
              <td colSpan={6} className={cn(TD, 'text-center italic text-gray-500 py-2')}>
                {t('baoDuongThietBi.viec.chuaCo')}
              </td>
            </tr>
          ) : (
            viecSorted.map((v, i) => (
              <tr key={v.id}>
                <td className={cn(TD, 'text-center tabular-nums')}>{i + 1}</td>
                <td className={TD}>
                  {v.noi_dung}
                  {!v.dang_dung && <span className="text-gray-500"> ({t('baoDuongThietBi.thietBi.ngungDung')})</span>}
                </td>
                <td className={cn(TD, 'text-center')}>
                  {v.chu_ky_ngay != null
                    ? t('baoDuongThietBi.chuKy.ngay', { n: v.chu_ky_ngay })
                    : t('baoDuongThietBi.chuKy.khongTheoLich')}
                </td>
                <td className={cn(TD, 'text-center tabular-nums')}>{formatYmdToDisplay(v.lan_gan_nhat) || '—'}</td>
                <td className={cn(TD, 'text-center tabular-nums')}>{formatYmdToDisplay(v.han_ke_tiep) || '—'}</td>
                <td className={cn(TD, 'text-center')}>{tinhTrangHanLabel(v.han_ke_tiep, homNay, t)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <TieuDeMuc>
        {t('baoDuongThietBi.preview.nhatKyTieuDe')}
        <span className="font-normal normal-case text-gray-500"> {t('baoDuongThietBi.preview.nhatKyGhiChu')}</span>
      </TieuDeMuc>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(TH, 'w-8')} style={NEN_DAU}>#</th>
            <th className={cn(TH, 'w-[16%]')} style={NEN_DAU}>{t('baoDuongThietBi.ghiNhan.ngayThucHien')}</th>
            <th className={TH} style={NEN_DAU}>{t('baoDuongThietBi.col.viec')}</th>
            <th className={cn(TH, 'w-[14%]')} style={NEN_DAU}>{t('baoDuongThietBi.ghiNhan.ketQua')}</th>
            <th className={cn(TH, 'w-[18%]')} style={NEN_DAU}>{t('baoDuongThietBi.ghiNhan.nguoiThucHien')}</th>
            <th className={TH} style={NEN_DAU}>{t('baoDuongThietBi.ghiNhan.noiDung')}</th>
          </tr>
        </thead>
        <tbody>
          {nhatKyIn.length === 0 ? (
            <tr>
              <td colSpan={6} className={cn(TD, 'text-center italic text-gray-500 py-2')}>
                {t('baoDuongThietBi.nhatKy.chuaCo')}
              </td>
            </tr>
          ) : (
            nhatKyIn.map((n, i) => (
              <tr key={n.id}>
                <td className={cn(TD, 'text-center tabular-nums')}>{i + 1}</td>
                <td className={cn(TD, 'text-center tabular-nums')}>{formatYmdToDisplay(n.ngay_thuc_hien)}</td>
                <td className={TD}>{n.viec_ten}</td>
                <td className={cn(TD, 'text-center')}>{t(`baoDuongThietBi.ketQua.${n.ket_qua}`)}</td>
                <td className={TD}>{n.nguoi_ten ?? '—'}</td>
                <td className={TD}>{n.noi_dung || ''}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <HangKyTen
        className="mt-auto pt-2"
        khoangKyMm={16}
        labels={[
          t('baoDuongThietBi.preview.nguoiLap'),
          t('baoDuongThietBi.preview.nguoiKiemTra'),
          t('baoDuongThietBi.preview.nguoiQuanLy'),
        ]}
      />
    </KhungPhieu>
  );
};

export default LyLichBaoDuongPreview;
