/**
 * Nội dung in phiếu kho A4 – header công ty + thông tin phiếu + bảng chi tiết hàng hóa.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { PhieuKho, PhieuKhoChiTiet, LoaiPhieuKho } from '../core/types';

function getLoaiLabel(loai: LoaiPhieuKho, t: (k: string) => string): string {
  const key = loai === 'nhap' ? 'phieuKho.tabs.nhap' : loai === 'xuat' ? 'phieuKho.tabs.xuat' : 'phieuKho.tabs.chuyen';
  return t(key);
}

function getTrangThaiLabel(trangThai: 0 | 1 | 2, t: (k: string) => string): string {
  const key = trangThai === 0 ? 'phieuKho.status.pending' : trangThai === 1 ? 'phieuKho.status.approved' : 'phieuKho.status.rejected';
  return t(key);
}

interface Props {
  phieu: PhieuKho;
}

const PhieuKhoPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const chiTiet: PhieuKhoChiTiet[] = phieu.chi_tiet ?? [];

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
    <div className="phieu-kho-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
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
        {t('phieuKho.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {phieu.so_phieu} · {getLoaiLabel(phieu.loai, t)} · {getTrangThaiLabel(phieu.trang_thai, t)}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('phieuKho.detail.basicInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('phieuKho.form.code')} value={phieu.so_phieu} />
          <TableRow label={t('phieuKho.form.date')} value={formatDate(phieu.ngay)} />
          <TableRow label={t('phieuKho.preview.loaiPhieu')} value={getLoaiLabel(phieu.loai, t)} />
          <TableRow label={t('phieuKho.form.warehouse')} value={phieu.ten_kho ?? phieu.id_kho} />
          {phieu.loai === 'chuyen' && (
            <TableRow label={t('phieuKho.store.khoDenCol')} value={phieu.ten_kho_den} />
          )}
          {phieu.loai === 'nhap' && phieu.id_nha_cung_cap && (
            <TableRow label={t('phieuKho.detail.supplier')} value={phieu.ten_nha_cung_cap} />
          )}
          {phieu.loai === 'xuat' && phieu.id_khach_hang && (
            <TableRow label={t('phieuKho.form.customer')} value={phieu.ten_khach_hang} />
          )}
          <TableRow
            label={t('phieuKho.store.statusCol')}
            value={getTrangThaiLabel(phieu.trang_thai, t)}
          />
          <TableRow label={t('phieuKho.form.description')} value={phieu.mo_ta} />
        </tbody>
      </table>

      {chiTiet.length > 0 && (
        <>
          <h2 className="text-[11pt] font-semibold mt-4 mb-2 text-gray-900">
            {t('phieuKho.form.itemsSection')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10pt]">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    #
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('phieuKho.form.itemCode')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('phieuKho.form.itemName')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('phieuKho.form.unit')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('phieuKho.form.quantity')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('phieuKho.form.note')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chiTiet.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="border border-gray-300 p-1.5 text-gray-900">{idx + 1}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-900 font-mono text-xs">
                      {c.ma_hang ?? '—'}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-gray-900">{c.ten_hang ?? '—'}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-900">{c.don_vi_tinh ?? '—'}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-900 tabular-nums">{c.so_luong}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-900 text-xs">
                      {c.ghi_chu ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-[7pt] text-gray-500 mt-5">
        {t('phieuKho.preview.printedAt')} {printedAt}
      </p>
    </div>
  );
};

export default PhieuKhoPreviewContent;
