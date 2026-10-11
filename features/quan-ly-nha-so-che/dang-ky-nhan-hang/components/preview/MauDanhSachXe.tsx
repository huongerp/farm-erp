/**
 * Mẫu in "Danh sách dự kiến xe giao nhận hàng" một ngày — mỗi xe một dòng, cùng cột với bảng
 * kê tay trên Google Sheet trước đây. Khổ / lề / cỡ chữ / bề rộng cột do khung PhieuInPage lo.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumberVN } from '../../../../../lib/utils';
import { COT_DANH_SACH_IN, ngayVn, type DongDanhSachIn } from '../../core/danh-sach-in';
import { KhungPhieu } from './PreviewParts';

/** Bề rộng ban đầu (%) theo thứ tự COT_DANH_SACH_IN. */
const RONG_COT = [5, 11, 13, 9, 9, 15, 11, 8, 19];
const CAN_GIUA = new Set(['stt', 'trangThai']);

const MauDanhSachXe: React.FC<{ ngay: string; dong: DongDanhSachIn[]; chiNhanh?: string }> = ({
  ngay,
  dong,
  chiNhanh,
}) => {
  const { t } = useTranslation();
  const th = 'border border-gray-400 bg-gray-100 px-1.5 py-1 font-semibold align-middle';
  const td = 'border border-gray-300 px-1.5 py-1 align-top break-words';
  return (
    <KhungPhieu
      title={t('dangKyNhanHang.inDanhSach.tieuDe', { ngay: ngayVn(ngay) })}
      subtitle={chiNhanh ? `${t('dangKyNhanHang.col.chiNhanh')}: ${chiNhanh}` : undefined}
    >
      <p className="font-semibold mb-2">{t('dangKyNhanHang.inDanhSach.soLuongXe', { n: dong.length })}</p>
      <table className="w-full border-collapse text-[0.95em]">
        <thead>
          <tr>
            {COT_DANH_SACH_IN.map((c, i) => (
              <th
                key={c}
                style={{ width: `${RONG_COT[i]}%` }}
                className={cn(th, CAN_GIUA.has(c) ? 'text-center' : c === 'soLuong' ? 'text-right' : 'text-left')}
              >
                {t(`dangKyNhanHang.inDanhSach.col.${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dong.length === 0 ? (
            <tr>
              <td colSpan={COT_DANH_SACH_IN.length} className={cn(td, 'text-center italic text-gray-500 py-4')}>
                {t('dangKyNhanHang.inDanhSach.trong')}
              </td>
            </tr>
          ) : (
            dong.map((d) => (
              <tr key={d.id} className="break-inside-avoid">
                <td className={cn(td, 'text-center tabular-nums')}>{d.stt}</td>
                <td className={cn(td, 'font-mono font-semibold')}>{d.soXe}</td>
                <td className={td}>{d.taiXe}</td>
                <td className={cn(td, 'text-center')}>{d.trangThai}</td>
                <td className={td}>{d.kho}</td>
                <td className={td}>{d.thongTin}</td>
                <td className={td}>{d.khachHang}</td>
                <td className={cn(td, 'text-right tabular-nums')}>
                  {d.soLuong != null ? formatNumberVN(d.soLuong) : ''}
                </td>
                <td className={td}>{d.loaiHang}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </KhungPhieu>
  );
};

export default MauDanhSachXe;
