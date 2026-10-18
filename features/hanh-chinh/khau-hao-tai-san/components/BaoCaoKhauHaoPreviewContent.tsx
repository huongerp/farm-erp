/**
 * Nội dung in báo cáo khấu hao theo kỳ — khung chuẩn hệ thống (PhieuInParts), A4 ngang: thông tin kỳ,
 * bảng tài sản (số thuần, "Đơn vị tính: đồng" một lần) + dòng tổng cộng, ô ký người lập / kế toán / giám đốc.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN } from '../../../../lib/utils';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import { getTrangThaiKyLabel } from '../core/constants';
import type { KyKhauHao, ChiTietKhauHao } from '../core/types';

const th = `${TH_IN} p-1.5 text-[9pt]`;
const td = `${TD_IN} p-1.5`;
const tien = (v: number | null | undefined) => (v != null ? formatNumberVN(v, { maxFractionDigits: 0 }) : '');
const COT_TIEN = [
  ['nguyen_gia', 'khauHaoTaiSan.detail.nguyenGiaCol'],
  ['gia_tri_con_lai_dau_ky', 'khauHaoTaiSan.detail.giaTriDauKyCol'],
  ['khau_hao_ky', 'khauHaoTaiSan.detail.khauHaoKyCol'],
  ['khau_hao_luy_ke', 'khauHaoTaiSan.detail.khauHaoLuyKeCol'],
  ['gia_tri_con_lai_cuoi_ky', 'khauHaoTaiSan.detail.giaTriCuoiKyCol'],
] as const;

interface Props {
  ky: KyKhauHao;
  chiTiet: ChiTietKhauHao[];
}

const BaoCaoKhauHaoPreviewContent: React.FC<Props> = ({ ky, chiTiet }) => {
  const { t } = useTranslation();
  const tong = (k: (typeof COT_TIEN)[number][0]) => chiTiet.reduce((s, c) => s + (Number(c[k]) || 0), 0);

  return (
    <KhungPhieu
      title={t('khauHaoTaiSan.preview.title')}
      subtitle={t('khauHaoTaiSan.preview.kyThang', { thang: String(ky.thang).padStart(2, '0'), nam: ky.nam })}
    >
      <BangThongTin
        rows={[
          [t('khauHaoTaiSan.store.trangThaiCol'), getTrangThaiKyLabel(ky.trang_thai, t)],
          [t('khauHaoTaiSan.preview.soTaiSan'), formatNumberVN(chiTiet.length)],
        ]}
      />

      {chiTiet.length > 0 && (
        <>
          <div className="flex items-end justify-between mt-3 mb-1">
            <p className="font-bold uppercase m-0">{t('khauHaoTaiSan.detail.chiTietSection')}</p>
            <p className="italic text-[0.9em] m-0">{t('common.phieuIn.donViTinhDong')}</p>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${th} text-center w-8`}>{t('common.phieuIn.stt')}</th>
                <th className={`${th} text-left w-[10%]`}>{t('khauHaoTaiSan.detail.maTaiSanCol')}</th>
                <th className={`${th} text-left`}>{t('khauHaoTaiSan.detail.tenTaiSanCol')}</th>
                <th className={`${th} text-left w-[12%]`}>{t('khauHaoTaiSan.detail.nhomCol')}</th>
                {COT_TIEN.map(([k, nhan]) => (
                  <th key={k} className={`${th} text-right w-[11%]`}>
                    {t(nhan)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((c, idx) => (
                <tr key={c.id}>
                  <td className={`${td} text-center`}>{idx + 1}</td>
                  <td className={`${td} text-[0.9em] break-all`}>{c.ma_tai_san}</td>
                  <td className={td}>{c.ten_tai_san}</td>
                  <td className={`${td} text-[0.9em]`}>{c.ten_nhom}</td>
                  {COT_TIEN.map(([k]) => (
                    <td key={k} className={`${td} text-right tabular-nums`}>
                      {tien(c[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="break-inside-avoid">
              <tr className="bg-gray-100 font-bold">
                <td colSpan={4} className={td}>
                  {t('common.phieuIn.tongCong')}
                </td>
                {COT_TIEN.map(([k]) => (
                  <td key={k} className={`${td} text-right tabular-nums`}>
                    {tien(tong(k))}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </>
      )}

      <HangKyTen
        className="mt-6"
        labels={[t('common.phieuIn.ky.nguoiLap'), t('common.phieuIn.ky.keToanTruong'), t('common.phieuIn.ky.giamDoc')]}
      />
    </KhungPhieu>
  );
};

export default BaoCaoKhauHaoPreviewContent;
