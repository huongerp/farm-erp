/** Nội dung phiếu in giám sát chất lượng — A4 ngang, khung chuẩn hệ thống (PhieuInParts). */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TieuDeMuc,
} from '../../../../../components/shared/phieu-in/PhieuInParts';
import { cn, formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import { tinhTieuChi, type KetQuaTieuChi } from '../../core/ket-luan';
import { tiLeLoi } from '../../core/ti-le';
import { coKetLuan } from '../../core/trang-thai';
import type { GiaTriKetQua, GiamSatChatLuong, ThungMau, TieuChi } from '../../core/types';

interface Props {
  phieu: GiamSatChatLuong;
  thung: ThungMau[];
  wMm: number;
  hMm: number;
  leMm: number;
}

const so = (n: number | null) => (n == null ? '—' : formatNumberVN(n, { maxFractionDigits: 2 }));
const phanTram = (n: number | null) => (n == null ? '—' : `${formatNumberVN(n, { maxFractionDigits: 1 })}%`);

function oThung(tc: TieuChi, v: GiaTriKetQua | undefined, daKiem: boolean): string {
  if (!daKiem) return '';
  if (tc.loai === 'dat_khong') return v === true ? '✓' : v === false ? '✗' : '—';
  if (typeof v !== 'number') return tc.loai === 'dem_loi' ? '0' : '—';
  return so(v);
}

function oTong(tc: TieuChi, kq: KetQuaTieuChi): string {
  if (tc.loai === 'dat_khong') return kq.soThungCoGiaTri ? `${kq.soKhong} ✗` : '—';
  if (tc.loai === 'do_luong') return kq.trungBinh != null ? `TB ${so(kq.trungBinh)}` : '—';
  return so(kq.tong);
}

function oNguong(tc: TieuChi, kq: KetQuaTieuChi): string {
  if (tc.loai === 'do_luong') {
    if (kq.nguongMin != null && kq.nguongMax != null) return `${so(kq.nguongMin)}–${so(kq.nguongMax)}`;
    if (kq.nguongMin != null) return `≥ ${so(kq.nguongMin)}`;
    if (kq.nguongMax != null) return `≤ ${so(kq.nguongMax)}`;
    return '—';
  }
  return kq.nguongMax != null ? `≤ ${so(kq.nguongMax)}` : '—';
}

const PhieuGsclPreview: React.FC<Props> = ({ phieu, thung, wMm, hMm, leMm }) => {
  const { t } = useTranslation();
  const daKiem = useMemo(() => thung.filter((x) => x.da_kiem), [thung]);
  const chiTiet = useMemo(() => {
    const kq = daKiem.map((x) => x.ket_qua);
    return phieu.tieu_chi.map((tc) => tinhTieuChi(tc, kq, phieu.so_thung_mau));
  }, [phieu.tieu_chi, phieu.so_thung_mau, daKiem]);
  const ketLuan = coKetLuan(phieu.trang_thai) ? phieu.ket_luan : null;

  const subtitle = [phieu.so_phieu, formatYmdToDisplay(phieu.ngay), t(`giamSatChatLuong.trangThai.${phieu.trang_thai}`)].join(
    ' · '
  );

  const thongTin: [string, React.ReactNode][] = [
    [t('giamSatChatLuong.col.farm'), phieu.ten_chi_nhanh],
    [t('giamSatChatLuong.col.thanhPham'), [phieu.ma_hang_hoa, phieu.ten_hang_hoa].filter(Boolean).join(' - ')],
    [t('giamSatChatLuong.col.cayHang'), phieu.ma_cay_hang],
    [
      t('giamSatChatLuong.detail.mauTrenCay'),
      t('giamSatChatLuong.detail.mauTrenCayValue', { mau: phieu.so_thung_mau, cay: phieu.so_thung_cay }),
    ],
    [t('giamSatChatLuong.col.nguoiTao'), phieu.ten_nguoi_tao],
    [
      t('giamSatChatLuong.detail.nguoiNop'),
      phieu.tg_nop ? `${phieu.ten_nguoi_nop ?? '—'} · ${formatDateTimeShort(phieu.tg_nop)}` : '',
    ],
  ];

  const th = 'border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold';
  const td = 'border border-gray-300 px-1.5 py-0.5 text-center tabular-nums';

  return (
    // compact: 11 tiêu chí × 10 thùng (mỗi thùng 2 cột lỗi / tỉ lệ) phải vừa MỘT trang A4 ngang.
    <KhungPhieu wMm={wMm} hMm={hMm} leMm={leMm} title={t('giamSatChatLuong.preview.title')} subtitle={subtitle} compact>
      <TieuDeMuc>{t('giamSatChatLuong.preview.thongTin')}</TieuDeMuc>
      <BangThongTin rows={thongTin} />

      <TieuDeMuc>{t('giamSatChatLuong.preview.ketQua')}</TieuDeMuc>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th rowSpan={2} className={cn(th, 'text-left')}>
              {t('giamSatChatLuong.detail.tieuChi')}
            </th>
            {thung.map((x) => (
              <th key={x.id} colSpan={2} className={cn(th, 'text-center whitespace-nowrap')}>
                {t('giamSatChatLuong.detail.thungSo', { stt: x.stt_thung })}
              </th>
            ))}
            <th rowSpan={2} className={cn(th, 'text-center')}>{t('giamSatChatLuong.detail.tong')}</th>
            <th rowSpan={2} className={cn(th, 'text-center')}>{t('giamSatChatLuong.detail.nguong')}</th>
            <th rowSpan={2} className={cn(th, 'text-center')}>{t('giamSatChatLuong.detail.dat')}</th>
          </tr>
          <tr>
            {thung.map((x) => (
              <React.Fragment key={x.id}>
                <th className={cn(th, 'text-center font-medium text-[0.85em] leading-tight')}>
                  {t('giamSatChatLuong.preview.loiThucTe')}
                </th>
                <th className={cn(th, 'text-center font-medium text-[0.85em] leading-tight')}>
                  {t('giamSatChatLuong.preview.tiLe')}
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-1.5 py-0.5 font-medium">{t('giamSatChatLuong.detail.tongNhanh')}</td>
            {thung.map((x) => (
              <td key={x.id} colSpan={2} className={cn(td, 'font-semibold')}>
                {x.da_kiem ? so(x.tong_nhanh) : ''}
              </td>
            ))}
            <td className={td} colSpan={3} />
          </tr>
          {phieu.tieu_chi.map((tc, i) => {
            const c = chiTiet[i];
            return (
              <tr key={tc.ma}>
                <td className="border border-gray-300 px-1.5 py-0.5 font-medium">
                  {tc.ten}
                  {tc.don_vi ? <span className="text-gray-500 font-normal"> ({tc.don_vi})</span> : null}
                </td>
                {thung.map((x) =>
                  tc.loai === 'dem_loi' ? (
                    <React.Fragment key={x.id}>
                      <td className={td}>{oThung(tc, x.ket_qua[tc.ma], x.da_kiem)}</td>
                      <td className={cn(td, 'text-gray-600 whitespace-nowrap')}>
                        {x.da_kiem ? phanTram(tiLeLoi(tc, x.ket_qua[tc.ma], x.tong_nhanh)) : ''}
                      </td>
                    </React.Fragment>
                  ) : (
                    <td key={x.id} colSpan={2} className={td}>
                      {oThung(tc, x.ket_qua[tc.ma], x.da_kiem)}
                    </td>
                  )
                )}
                <td className={cn(td, 'font-semibold')}>{oTong(tc, c)}</td>
                <td className={cn(td, 'text-gray-600')}>{oNguong(tc, c)}</td>
                <td className={cn(td, 'font-bold', c.dat === false && 'text-red-700')}>
                  {c.dat == null ? '—' : c.dat ? '✓' : '✗'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 flex items-baseline gap-2 break-inside-avoid">
        <span className="font-bold uppercase">{t('giamSatChatLuong.preview.ketLuan')}:</span>
        {ketLuan ? (
          <span className={cn('font-bold uppercase text-[1.15em]', ketLuan === 'khong_dat' ? 'text-red-700' : 'text-green-700')}>
            {t(`giamSatChatLuong.ketLuan.${ketLuan}`)}
          </span>
        ) : (
          <span className="italic text-gray-500">{t('giamSatChatLuong.preview.chuaKetLuan')}</span>
        )}
      </div>

      {phieu.ghi_chu && (
        <p className="mt-1.5 whitespace-pre-line">
          <span className="font-semibold">{t('giamSatChatLuong.col.ghiChu')}:</span> {phieu.ghi_chu}
        </p>
      )}

      <HangKyTen
        className="mt-auto pt-2"
        khoangKyMm={10}
        labels={[
          t('giamSatChatLuong.preview.kyNguoiKiem'),
          t('giamSatChatLuong.preview.kyQc'),
          t('giamSatChatLuong.preview.kyQuanLyFarm'),
        ]}
      />
    </KhungPhieu>
  );
};

export default PhieuGsclPreview;
