/**
 * Mảnh dựng cho 3 mẫu in của Đăng ký nhận hàng. Khung giấy, dòng chấm, ô ký, lưới thông tin
 * dùng chung toàn hệ thống (components/shared/phieu-in/PhieuInParts); riêng bảng hàng ở đây.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumberVN } from '../../../../../lib/utils';
import { KhungPhieu as KhungPhieuChung } from '../../../../../components/shared/phieu-in/PhieuInParts';
import type { NhomHangHoa } from '../../core/gop-hang-hoa';
import { kichThuocGiay, leTrang, type HuongGiay, type KhoGiay } from '../../core/mau-in';

export { BangThongTin, DongCham, HangKyTen, TieuDeMuc } from '../../../../../components/shared/phieu-in/PhieuInParts';

interface KhungProps {
  kho: KhoGiay;
  huong: HuongGiay;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Tờ giấy đúng khổ / hướng của mẫu đang chọn — giữ class `dknh-preview-content` cho CSS in + xuất file. */
export const KhungPhieu: React.FC<KhungProps> = ({ kho, huong, title, subtitle, children }) => {
  const { wMm, hMm } = kichThuocGiay(kho, huong);
  return (
    <KhungPhieuChung
      wMm={wMm}
      hMm={hMm}
      leMm={leTrang(kho)}
      title={title}
      subtitle={subtitle}
      compact={kho === 'a5'}
      className="dknh-preview-content"
    >
      {children}
    </KhungPhieuChung>
  );
};

export const BangHangHoa: React.FC<{ nhom: NhomHangHoa[] }> = ({ nhom }) => {
  const { t } = useTranslation();
  const tong = nhom.reduce((s, n) => s + n.so_luong, 0);
  const th = 'border border-gray-400 bg-gray-100 px-2 py-1 font-semibold';
  const td = 'border border-gray-300 px-2 py-1';
  return (
    <table className="w-full border-collapse text-[0.95em]">
      <thead>
        <tr>
          <th className={cn(th, 'w-[8%] text-center')}>STT</th>
          <th className={cn(th, 'w-[20%] text-left')}>{t('dangKyNhanHang.preview.maHang')}</th>
          <th className={cn(th, 'text-left')}>{t('dangKyNhanHang.preview.tenHang')}</th>
          <th className={cn(th, 'w-[12%] text-center')}>{t('dangKyNhanHang.hangHoa.dvt')}</th>
          <th className={cn(th, 'w-[14%] text-right')}>{t('dangKyNhanHang.hangHoa.soLuong')}</th>
        </tr>
      </thead>
      <tbody>
        {nhom.length === 0 ? (
          <tr>
            <td className={cn(td, 'text-center text-gray-500 italic py-3')} colSpan={5}>
              {t('dangKyNhanHang.hangHoa.empty')}
            </td>
          </tr>
        ) : (
          nhom.map((n, i) => (
            <tr key={n.id_hang_hoa}>
              <td className={cn(td, 'text-center')}>{i + 1}</td>
              <td className={cn(td, 'font-mono')}>{n.ma_hang_hoa}</td>
              <td className={td}>{n.ten_hang_hoa}</td>
              <td className={cn(td, 'text-center')}>{n.dvt}</td>
              <td className={cn(td, 'text-right tabular-nums')}>{formatNumberVN(n.so_luong)}</td>
            </tr>
          ))
        )}
      </tbody>
      {nhom.length > 0 && (
        <tfoot>
          <tr>
            <td className={cn(td, 'text-right font-bold')} colSpan={4}>
              {t('dangKyNhanHang.preview.tong')}
            </td>
            <td className={cn(td, 'text-right font-bold tabular-nums')}>{formatNumberVN(tong)}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};
