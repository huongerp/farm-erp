/**
 * Nội dung in phiếu kiểm kê kho (Nhà sơ chế / Phân thuốc) — khung chuẩn hệ thống (PhieuInParts): đầu phiếu (mã đợt),
 * thông tin đợt, dòng thống kê kết quả, bảng chi tiết (ẩn cột ghi chú khi trống), ô ký.
 * Nội dung phải khớp với file XLSX export.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { cotCoDuLieu } from '../../../../lib/phieu-in/tong-so-luong';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import { getTrangThaiDotLabelPT, getKetQuaLabelPT } from '../core/constants';
import {
  getKiemKeKhoPTChiTietStats,
  buildKiemKeKhoStatsText,
  formatKiemKeKhoPTQty,
  getKiemKeKhoVariance,
  getKiemKeKhoPreviewSignLabels,
} from '../core/kkpt-preview-layout';
import type { DotKiemKePT, ChiTietKiemKePT } from '../core/types';

const th = `${TH_IN} p-1.5 text-[9pt]`;
const td = `${TD_IN} p-1.5`;
const ngayIn = (v?: string | null) => formatYmdToDisplay(v?.slice(0, 10));

interface Props {
  dot: DotKiemKePT;
  chiTiet: ChiTietKiemKePT[];
}

const PhieuKiemKePTPreviewContent: React.FC<Props> = ({ dot, chiTiet }) => {
  const { t } = useTranslation();
  const stats = getKiemKeKhoPTChiTietStats(chiTiet);
  const coGhiChu = cotCoDuLieu(chiTiet, (c) => c.ghi_chu_dong);
  const [kyPhuTrach, ...kyKhac] = getKiemKeKhoPreviewSignLabels(t);

  const thongTin: [string, React.ReactNode][] = [
    [t('kiemKeKhoPT.store.tenDotCol'), dot.ten_dot],
    [t('kiemKeKhoPT.store.trangThaiCol'), getTrangThaiDotLabelPT(dot.trang_thai, t)],
    [t('kiemKeKhoPT.store.ngayBatDauCol'), ngayIn(dot.ngay_bat_dau)],
    [t('kiemKeKhoPT.store.ngayKetThucCol'), ngayIn(dot.ngay_ket_thuc)],
    [t('kiemKeKhoPT.store.nguoiPhuTrachCol'), dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach],
  ];

  return (
    <KhungPhieu title={t('kiemKeKhoPT.preview.title')} soPhieu={dot.ma_dot}>
      <BangThongTin rows={thongTin} />
      {dot.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('kiemKeKhoPT.store.ghiChuCol')}: </span>
          {dot.ghi_chu}
        </p>
      )}

      {chiTiet.length > 0 ? (
        <>
          <p className="font-bold uppercase mt-3 mb-0.5">{t('kiemKeKhoPT.chiTietSection')}</p>
          <p className="text-[0.9em] text-gray-600 mt-0 mb-1">{buildKiemKeKhoStatsText(stats, t)}</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${th} text-center w-[5%]`}>{t('common.phieuIn.stt')}</th>
                <th className={`${th} text-left w-[13%]`}>{t('kiemKeKhoPT.store.khoCol')}</th>
                <th className={`${th} text-left`}>{t('kiemKeKhoPT.store.hangHoaCol')}</th>
                <th className={`${th} text-right w-[11%]`}>{t('kiemKeKhoPT.store.soLuongSoCol')}</th>
                <th className={`${th} text-right w-[11%]`}>{t('kiemKeKhoPT.store.soLuongThucTeCol')}</th>
                <th className={`${th} text-right w-[11%]`}>{t('kiemKeKhoPT.detail.chenhLech')}</th>
                <th className={`${th} text-left w-[10%]`}>{t('kiemKeKhoPT.store.ketQuaCol')}</th>
                {coGhiChu && <th className={`${th} text-left`}>{t('kiemKeKhoPT.store.ghiChuCol')}</th>}
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((c, idx) => {
                const lech = getKiemKeKhoVariance(c);
                return (
                  <tr key={c.id}>
                    <td className={`${td} text-center tabular-nums`}>{idx + 1}</td>
                    <td className={td}>{c.ten_kho || c.ma_kho}</td>
                    <td className={td}>{c.ten_hang || c.ma_hang}</td>
                    <td className={`${td} tabular-nums text-right`}>{formatKiemKeKhoPTQty(c.so_luong_so, c.don_vi_tinh)}</td>
                    <td className={`${td} tabular-nums text-right`}>
                      {formatKiemKeKhoPTQty(c.so_luong_thuc_te, c.don_vi_tinh)}
                    </td>
                    <td className={`${td} tabular-nums text-right`}>
                      {lech == null ? '' : `${lech > 0 ? '+' : ''}${formatKiemKeKhoPTQty(lech, c.don_vi_tinh)}`}
                    </td>
                    <td className={td}>{getKetQuaLabelPT(c.ket_qua, t)}</td>
                    {coGhiChu && <td className={`${td} text-[0.9em]`}>{c.ghi_chu_dong}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <p className="text-gray-500 italic mt-3 mb-0">{t('kiemKeKhoPT.chiTietEmpty')}</p>
      )}

      <HangKyTen
        className="mt-6"
        labels={[{ label: kyPhuTrach, ten: dot.ten_nguoi_phu_trach }, ...kyKhac]}
      />
    </KhungPhieu>
  );
};

export default PhieuKiemKePTPreviewContent;
