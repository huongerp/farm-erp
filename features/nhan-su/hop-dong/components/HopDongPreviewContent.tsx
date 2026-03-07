/**
 * Nội dung in hợp đồng A4 – dùng cho trang preview và in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../../lib/utils';
import { getLoaiHopDongLabel, getTrangThaiHopDongLabel } from '../core/constants';
import type { HopDong } from '../core/types';

interface Props {
  data: HopDong;
}

const TableRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <tr>
    <td className="w-[38%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50 align-top">
      {label}
    </td>
    <td className="border border-gray-300 p-1.5 text-gray-900 align-top">{value ?? '—'}</td>
  </tr>
);

const HopDongPreviewContent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const printedAt = formatDateTime(new Date());

  return (
    <div className="hop-dong-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
      <h1 className="text-[14pt] font-bold mb-1">{t('hopDong.pageTitle')}</h1>
      <p className="text-[10pt] text-gray-600 mb-4">
        {data.so_hop_dong} · {data.ten_ung_vien ?? data.id_ung_vien}
      </p>

      <h2 className="text-[11pt] font-bold text-gray-800 mt-4 mb-2 border-b border-gray-300 pb-0.5">
        {t('hopDong.detail.basicInfo')}
      </h2>
      <table className="w-full border-collapse text-[10pt] mb-4">
        <tbody>
          <TableRow label={t('hopDong.table.ungVien')} value={data.ten_ung_vien} />
          <TableRow label={t('hopDong.table.soHopDong')} value={data.so_hop_dong} />
          <TableRow
            label={t('hopDong.table.loaiHopDong')}
            value={getLoaiHopDongLabel(data.loai_hop_dong, t)}
          />
          <TableRow label={t('hopDong.table.ngayBatDau')} value={formatDate(data.ngay_bat_dau)} />
          <TableRow
            label={t('hopDong.table.ngayKetThuc')}
            value={data.ngay_ket_thuc ? formatDate(data.ngay_ket_thuc) : '—'}
          />
          <TableRow
            label={t('hopDong.table.trangThai')}
            value={getTrangThaiHopDongLabel(data.trang_thai, t)}
          />
          <TableRow label={t('hopDong.ghiChu')} value={data.ghi_chu} />
        </tbody>
      </table>

      <h2 className="text-[11pt] font-bold text-gray-800 mt-4 mb-2 border-b border-gray-300 pb-0.5">
        {t('hopDong.detail.terms')}
      </h2>
      <table className="w-full border-collapse text-[10pt] mb-4">
        <tbody>
          <TableRow label={t('hopDong.bacLuong')} value={data.bac_luong} />
          <TableRow label={t('hopDong.mucLuong')} value={data.muc_luong} />
          <TableRow
            label={t('hopDong.ngayVaoLam')}
            value={data.ngay_vao_lam ? formatDate(data.ngay_vao_lam) : '—'}
          />
          <TableRow label={t('hopDong.coCheKhac')} value={data.co_che_khac} />
          <TableRow label={t('hopDong.ghiChuKhac')} value={data.ghi_chu_khac} />
        </tbody>
      </table>

      <p className="text-[9pt] text-gray-500 mt-6">{t('hopDong.preview.printedAt')} {printedAt}</p>
    </div>
  );
};

export default HopDongPreviewContent;
