/**
 * Nội dung in phiếu cấp phát / thu hồi A4.
 * Bố cục: header công ty, ngày, tiêu đề, mã phiếu,
 * người giao / người nhận, ghi chú, bảng chi tiết tài sản, 3 ô chữ ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { formatDateVietnameseLong, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiChiTiet, LoaiPhieu } from '../core/types';
import { getLoaiPhieuLabel } from '../core/constants';

function getTitleUppercase(loai: LoaiPhieu, t: TFunction): string {
  return `PHIẾU ${getLoaiPhieuLabel(loai, t).toUpperCase()}`;
}

interface Props {
  phieu: PhieuCapPhatThuHoi;
}

const PhieuCPTHPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const chiTiet: PhieuCapPhatThuHoiChiTiet[] = phieu.chi_tiet ?? [];

  return (
    <div className="phieu-cpth-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full flex flex-col">
      {/* Header công ty */}
      <div className="flex items-start gap-4 pb-4 mb-4 border-b-2 border-gray-300">
        {companyInfo.appLogo && (
          <img src={companyInfo.appLogo} alt="Logo" className="w-16 h-16 object-contain shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[14pt] font-bold text-gray-900 uppercase tracking-tight">
            {companyInfo.companyName}
          </h2>
          {companyInfo.address && (
            <p className="text-[9pt] text-gray-600 mt-0.5">
              {t('company.address')}: {companyInfo.address}
            </p>
          )}
          {(companyInfo.email || companyInfo.phone) && (
            <p className="text-[9pt] text-gray-600">
              {companyInfo.email && (
                <span>{t('company.email')}: {companyInfo.email}</span>
              )}
              {companyInfo.email && companyInfo.phone && ' · '}
              {companyInfo.phone && (
                <span>{t('company.phone')}: {companyInfo.phone}</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Ngày */}
      <p className="text-[10pt] text-gray-700 mb-1 text-left font-normal not-italic">
        {formatDateVietnameseLong(phieu.ngay_thuc_hien)}
      </p>

      {/* Tiêu đề */}
      <h1 className="text-center text-[16pt] font-bold mb-1 uppercase">
        {getTitleUppercase(phieu.loai_phieu, t)}
      </h1>
      <p className="text-center text-[10pt] text-gray-600 mb-4">
        ({t('capPhatThuHoi.store.maPhieuCol')}: {phieu.ma_phieu})
      </p>

      {/* Thông tin người */}
      <div className="grid grid-cols-2 gap-4 text-[10pt] mb-3">
        <div>
          <span className="font-semibold text-gray-600">{t('capPhatThuHoi.preview.nguoiGiao')}: </span>
          <span className="text-gray-900">{phieu.ten_nguoi_giu_truoc ?? '—'}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">{t('capPhatThuHoi.preview.nguoiNhan')}: </span>
          <span className="text-gray-900">{phieu.ten_nguoi_giu_sau ?? '—'}</span>
        </div>
      </div>

      {/* Người thực hiện */}
      <p className="text-[10pt] mb-1">
        <span className="font-semibold text-gray-600">{t('capPhatThuHoi.store.nguoiThucHienCol')}: </span>
        <span className="text-gray-900">{phieu.ten_nguoi_thuc_hien ?? '—'}</span>
      </p>

      {/* Ghi chú */}
      <p className="text-[10pt] mb-4">
        <span className="font-semibold text-gray-600">{t('capPhatThuHoi.store.ghiChuCol')}: </span>
        <span className="text-gray-900">{phieu.ghi_chu ?? '—'}</span>
      </p>

      {/* Bảng chi tiết tài sản */}
      <h2 className="text-[11pt] font-semibold mt-2 mb-2 text-gray-900">
        {t('capPhatThuHoi.detail.sectionAssets')}
      </h2>
      {chiTiet.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-10">TT</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">{t('capPhatThuHoi.store.maTaiSanCol')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">{t('capPhatThuHoi.store.taiSanCol')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">{t('capPhatThuHoi.store.noiLuuTruocCol')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">{t('capPhatThuHoi.store.noiLuuSauCol')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">{t('capPhatThuHoi.store.ghiChuCol')}</th>
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((ct, idx) => (
                <tr key={ct.id}>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">{ct.ma_tai_san ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900">{ct.ten_tai_san ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900">{ct.ten_noi_luu_truoc ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900">{ct.ten_noi_luu_sau ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">{ct.ghi_chu ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold text-gray-900">
                <td colSpan={6} className="border border-gray-300 p-1.5 text-[10pt]">
                  {t('capPhatThuHoi.preview.totalAssets')}: {chiTiet.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="text-[10pt] text-gray-500 italic">{t('capPhatThuHoi.empty')}</p>
      )}

      {/* 3 ô chữ ký */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-4 border-t border-gray-300">
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('capPhatThuHoi.preview.signNguoiGiao')}</p>
          <p className="text-[8pt] text-gray-500">{t('capPhatThuHoi.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('capPhatThuHoi.preview.signNguoiNhan')}</p>
          <p className="text-[8pt] text-gray-500">{t('capPhatThuHoi.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('capPhatThuHoi.preview.signNguoiThucHien')}</p>
          <p className="text-[8pt] text-gray-500">{t('capPhatThuHoi.preview.signHint')}</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-4 border-t border-gray-200 print:mt-8">
        <p className="text-[7pt] text-gray-500 text-left">
          {t('capPhatThuHoi.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default PhieuCPTHPreviewContent;
