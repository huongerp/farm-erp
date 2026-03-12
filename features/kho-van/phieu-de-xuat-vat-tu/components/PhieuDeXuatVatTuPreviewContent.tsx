/**
 * Nội dung in phiếu đề xuất vật tư A4 – header công ty + thông tin phiếu + bảng chi tiết hàng hóa.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { PhieuDeXuatVatTu } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';

function getTrangThaiLabel(trangThai: string, t: (k: string) => string): string {
  if (trangThai === TRANG_THAI_CHO_DUYET) return t('phieuDeXuatVatTu.status.pending');
  if (trangThai === TRANG_THAI_DA_DUYET) return t('phieuDeXuatVatTu.status.approved');
  if (trangThai === TRANG_THAI_KHONG_DUYET) return t('phieuDeXuatVatTu.status.rejected');
  return trangThai;
}

interface Props {
  phieu: PhieuDeXuatVatTu;
}

const PhieuDeXuatVatTuPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const chiTiet = phieu.chi_tiet ?? [];

  const TableRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | null | undefined;
  }) => (
    <tr>
      <td className="w-[40%] border border-gray-300 p-1.5 text-[10pt] font-semibold text-gray-600 bg-gray-50/50">
        {label}
      </td>
      <td className="border border-gray-300 p-1.5 text-[10pt] text-gray-900">{value ?? '—'}</td>
    </tr>
  );

  return (
    <div className="phieu-de-xuat-preview bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
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

      <h1 className="text-center text-[16pt] font-bold mb-2 uppercase">
        {t('phieuDeXuatVatTu.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {phieu.so_phieu} · {getTrangThaiLabel(phieu.trang_thai, t)}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('phieuDeXuatVatTu.detail.basicInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('phieuDeXuatVatTu.form.code')} value={phieu.so_phieu} />
          <TableRow label={t('phieuDeXuatVatTu.form.date')} value={phieu.ngay} />
          <TableRow label={t('phieuDeXuatVatTu.form.requiredDate')} value={phieu.ngay_can} />
          <TableRow label={t('phieuDeXuatVatTu.form.place')} value={phieu.ten_noi_de_xuat} />
          <TableRow label={t('phieuDeXuatVatTu.form.requester')} value={phieu.ten_nguoi_de_xuat} />
          <TableRow label={t('phieuDeXuatVatTu.form.approver')} value={phieu.ten_nguoi_duyet ?? '—'} />
          <TableRow label={t('phieuDeXuatVatTu.form.notes')} value={phieu.ghi_chu} />
        </tbody>
      </table>

      {chiTiet.length > 0 && (
        <>
          <h3 className="text-[11pt] font-bold mt-4 mb-2">{t('phieuDeXuatVatTu.form.itemsSection')}</h3>
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-left font-semibold w-8">#</th>
                <th className="border border-gray-300 p-1.5 text-left font-semibold min-w-[80px]">
                  {t('phieuDeXuatVatTu.form.itemCode')}
                </th>
                <th className="border border-gray-300 p-1.5 text-left font-semibold">
                  {t('phieuDeXuatVatTu.form.itemName')}
                </th>
                <th className="border border-gray-300 p-1.5 text-center font-semibold w-16">
                  {t('phieuDeXuatVatTu.form.unit')}
                </th>
                <th className="border border-gray-300 p-1.5 text-right font-semibold w-20">
                  {t('phieuDeXuatVatTu.form.quantity')}
                </th>
                <th className="border border-gray-300 p-1.5 text-left font-semibold">
                  {t('phieuDeXuatVatTu.form.specs')}
                </th>
                <th className="border border-gray-300 p-1.5 text-left font-semibold">
                  {t('phieuDeXuatVatTu.form.note')}
                </th>
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((ct, idx) => (
                <tr key={ct.id}>
                  <td className="border border-gray-300 p-1.5 text-gray-600">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5">{ct.ten_hang ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">{ct.don_vi_tinh ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-right tabular-nums">{ct.so_luong}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-600">{ct.thong_so ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-600">{ct.ghi_chu ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p className="text-[7pt] text-gray-500 mt-6 font-sans">
        {t('phieuDeXuatVatTu.preview.printedAt')} {formatDateTime(new Date())}
      </p>
    </div>
  );
};

export default PhieuDeXuatVatTuPreviewContent;
