/**
 * Nội dung in phiếu thanh lý A4 – dùng cho trang preview và in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../../lib/utils';
import type { PhieuThanhLy } from '../core/types';
import type { HopDong } from '../core/types';

const LY_DO_LABEL_KEYS: Record<string, string> = {
  'nghi-viec': 'hopDong.phieuThanhLy.lyDoNghiViec',
  'het-han-hd': 'hopDong.phieuThanhLy.lyDoHetHanHD',
  'thoa-thuan': 'hopDong.phieuThanhLy.lyDoThoaThuan',
  'vi-pham': 'hopDong.phieuThanhLy.lyDoViPham',
  khac: 'hopDong.phieuThanhLy.lyDoKhac',
};

function getLyDoLabel(lyDo: string, t: (key: string) => string): string {
  return t(LY_DO_LABEL_KEYS[lyDo] ?? lyDo);
}

interface Props {
  phieu: PhieuThanhLy;
  hopDong: HopDong;
}

const TableRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <tr>
    <td className="w-[38%] border border-gray-300 p-1.5 font-semibold text-gray-600 bg-gray-50/50 align-top">
      {label}
    </td>
    <td className="border border-gray-300 p-1.5 text-gray-900 align-top">{value ?? '—'}</td>
  </tr>
);

const PhieuThanhLyPreviewContent: React.FC<Props> = ({ phieu, hopDong }) => {
  const { t } = useTranslation();
  const printedAt = formatDateTime(new Date());

  return (
    <div className="phieu-thanh-ly-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
      <h1 className="text-[14pt] font-bold mb-1">{t('hopDong.phieuThanhLy.title')}</h1>
      <p className="text-[10pt] text-gray-600 mb-4">
        {phieu.so_phieu} · {hopDong.ten_ung_vien ?? hopDong.id_ung_vien}
      </p>

      <table className="w-full border-collapse text-[10pt] mb-4">
        <tbody>
          <TableRow label={t('hopDong.table.ungVien')} value={hopDong.ten_ung_vien} />
          <TableRow label={t('hopDong.table.soHopDong')} value={hopDong.so_hop_dong} />
          <TableRow label={t('hopDong.phieuThanhLy.title')} value={phieu.so_phieu} />
          <TableRow label={t('hopDong.phieuThanhLy.ngayThanhLy')} value={formatDate(phieu.ngay_thanh_ly)} />
          <TableRow label={t('hopDong.phieuThanhLy.lyDo')} value={getLyDoLabel(phieu.ly_do, t)} />
          <TableRow label={t('hopDong.ghiChu')} value={phieu.ghi_chu} />
        </tbody>
      </table>

      <p className="text-[9pt] text-gray-500 mt-6">{t('hopDong.preview.printedAt')} {printedAt}</p>
    </div>
  );
};

export default PhieuThanhLyPreviewContent;
