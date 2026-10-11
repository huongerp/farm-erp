/**
 * Mẫu in "Danh sách dự kiến xe giao nhận hàng" theo bộ lọc của danh sách — mỗi xe một dòng, cùng
 * cột với bảng kê tay trên Google Sheet trước đây (thêm cột Ngày khi danh sách trải nhiều ngày).
 * Khổ / lề / cỡ chữ / bề rộng cột do khung PhieuInPage lo.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumberVN } from '../../../../../lib/utils';
import { cotDanhSachIn, type CotDanhSachIn, type DongDanhSachIn } from '../../core/danh-sach-in';
import { KhungPhieu } from './PreviewParts';

/** Bề rộng ban đầu theo tỉ lệ — quy về % theo các cột đang in. */
const TI_LE_COT: Record<CotDanhSachIn, number> = {
  stt: 5,
  ngay: 9,
  soXe: 11,
  taiXe: 13,
  trangThai: 9,
  kho: 9,
  thongTin: 15,
  khachHang: 11,
  soLuong: 8,
  loaiHang: 19,
};
const CAN_GIUA = new Set<CotDanhSachIn>(['stt', 'ngay', 'trangThai']);

const oDong = (d: DongDanhSachIn, c: CotDanhSachIn): React.ReactNode =>
  c === 'soLuong' ? (d.soLuong != null ? formatNumberVN(d.soLuong) : '') : d[c];

const MauDanhSachXe: React.FC<{ tieuDe: string; phuDe?: string; dong: DongDanhSachIn[] }> = ({
  tieuDe,
  phuDe,
  dong,
}) => {
  const { t } = useTranslation();
  const cot = cotDanhSachIn(dong);
  const tong = cot.reduce((s, c) => s + TI_LE_COT[c], 0);
  const th = 'border border-gray-400 bg-gray-100 px-1.5 py-1 font-semibold align-middle';
  const td = 'border border-gray-300 px-1.5 py-1 align-top break-words';
  return (
    <KhungPhieu title={tieuDe} subtitle={phuDe}>
      <p className="font-semibold mb-2">{t('dangKyNhanHang.inDanhSach.soLuongXe', { n: dong.length })}</p>
      <table className="w-full border-collapse text-[0.95em]">
        <thead>
          <tr>
            {cot.map((c) => (
              <th
                key={c}
                style={{ width: `${((TI_LE_COT[c] / tong) * 100).toFixed(2)}%` }}
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
              <td colSpan={cot.length} className={cn(td, 'text-center italic text-gray-500 py-4')}>
                {t('dangKyNhanHang.inDanhSach.trong')}
              </td>
            </tr>
          ) : (
            dong.map((d) => (
              <tr key={d.id} className="break-inside-avoid">
                {cot.map((c) => (
                  <td
                    key={c}
                    className={cn(
                      td,
                      CAN_GIUA.has(c) && 'text-center',
                      (c === 'stt' || c === 'ngay' || c === 'soLuong') && 'tabular-nums',
                      c === 'soLuong' && 'text-right',
                      c === 'soXe' && 'font-mono font-semibold'
                    )}
                  >
                    {oDong(d, c)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </KhungPhieu>
  );
};

export default MauDanhSachXe;
