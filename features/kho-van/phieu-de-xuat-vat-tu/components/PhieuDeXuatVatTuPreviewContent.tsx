/**
 * Nội dung in phiếu đề xuất vật tư A4 – theo mẫu Phiếu in đề xuất.docx.
 * Bố cục: header công ty, ngày tiếng Việt, ĐỀ XUẤT VẬT TƯ, Đơn vị/Người tạo/Ngày lập/Ghi chú, bảng chi tiết (TT, Tên vật tư, Thông số KT, ĐVT, SL, Ghi chú), 4 ô chữ ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateVietnameseLong, formatDateTime, formatNumberVN } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { PhieuDeXuatVatTu } from '../core/types';

interface Props {
  phieu: PhieuDeXuatVatTu;
}

const PhieuDeXuatVatTuPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const chiTiet = phieu.chi_tiet ?? [];

  return (
    <div className="phieu-de-xuat-preview-content phieu-de-xuat-preview bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full flex flex-col">
      {/* Header công ty */}
      <div className="flex items-start gap-4 pb-4 mb-4 border-b-2 border-gray-300">
        {companyInfo.appLogo && (
          <img src={companyInfo.appLogo} alt="" className="w-14 h-14 object-contain shrink-0" />
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
                <span>
                  {t('company.email')}: {companyInfo.email}
                </span>
              )}
              {companyInfo.email && companyInfo.phone && ' · '}
              {companyInfo.phone && (
                <span>
                  {t('company.phone')}: {companyInfo.phone}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Ngày dạng "Ngày dd tháng mm năm yyyy" */}
      <p className="text-[10pt] text-gray-700 mb-1 text-left font-normal not-italic">
        {formatDateVietnameseLong(phieu.ngay)}
      </p>

      {/* Tiêu đề: ĐỀ XUẤT VẬT TƯ */}
      <h1 className="text-center text-[16pt] font-bold mb-1 uppercase">
        ĐỀ XUẤT VẬT TƯ
      </h1>
      <p className="text-center text-[10pt] text-gray-600 mb-4">
        ({t('phieuDeXuatVatTu.form.code')}: {phieu.so_phieu})
      </p>

      {/* Thông tin dạng dòng: Đơn vị, Người tạo, Ngày lập, Ghi chú */}
      <div className="text-[10pt] space-y-1.5 mb-4">
        <p>
          <span className="font-semibold text-gray-600">{t('phieuDeXuatVatTu.preview.donVi')}: </span>
          <span className="text-gray-900">{phieu.ten_noi_de_xuat ?? '—'}</span>
        </p>
        <p>
          <span className="font-semibold text-gray-600">{t('phieuDeXuatVatTu.preview.nguoiTao')}: </span>
          <span className="text-gray-900">{phieu.ten_nguoi_de_xuat ?? '—'}</span>
          <span className="text-gray-600"> . {t('phieuDeXuatVatTu.preview.boPhan')}: —</span>
        </p>
        <p>
          <span className="font-semibold text-gray-600">{t('phieuDeXuatVatTu.preview.ngayLap')} </span>
          <span className="text-gray-900">{formatDate(phieu.ngay)}</span>
          <span className="text-gray-600"> ({t('phieuDeXuatVatTu.form.requiredDate')}: {formatDate(phieu.ngay_can)})</span>
        </p>
        <p>
          <span className="font-semibold text-gray-600">{t('phieuDeXuatVatTu.form.notes')} </span>
          <span className="text-gray-900">{phieu.ghi_chu ?? '—'}</span>
        </p>
      </div>

      {/* Bảng chi tiết: TT, Tên vật tư, Thông số kỹ thuật, ĐVT, Số lượng, Ghi chú */}
      <h2 className="text-[11pt] font-semibold mt-2 mb-2 text-gray-900">
        {t('phieuDeXuatVatTu.preview.danhSachChiTiet')}
      </h2>
      {chiTiet.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-10">
                  TT
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuDeXuatVatTu.form.itemName')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuDeXuatVatTu.form.specs')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-16">
                  {t('phieuDeXuatVatTu.form.unit')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-20">
                  {t('phieuDeXuatVatTu.form.quantity')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuDeXuatVatTu.form.note')}
                </th>
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((c, idx) => (
                <tr key={c.id}>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900">{c.ten_hang ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">{c.thong_so ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-center">{c.don_vi_tinh ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 tabular-nums text-right">{formatNumberVN(c.so_luong)}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">{c.ghi_chu ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[10pt] text-gray-500 italic">{t('phieuDeXuatVatTu.form.noItems')}</p>
      )}

      {/* Bốn ô chữ ký */}
      <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-300">
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuDeXuatVatTu.preview.signCreator')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuDeXuatVatTu.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuDeXuatVatTu.preview.signChecker')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuDeXuatVatTu.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuDeXuatVatTu.preview.signRelated')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuDeXuatVatTu.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuDeXuatVatTu.preview.signApprover')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuDeXuatVatTu.preview.signHint')}</p>
        </div>
      </div>

      {/* Footer: In lúc */}
      <footer className="mt-auto pt-4 border-t border-gray-200 print:mt-8">
        <p className="text-[7pt] text-gray-500 text-left">
          {t('phieuDeXuatVatTu.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default PhieuDeXuatVatTuPreviewContent;
