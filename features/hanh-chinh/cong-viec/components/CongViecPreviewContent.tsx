/**
 * Nội dung in công việc khổ A4 – header công ty + thông tin công việc + báo cáo.
 * Dùng cho trang preview /hanh-chinh/cong-viec/preview/:id và lệnh in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime, formatDateTimeShort } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiLabel, getUuTienLabel } from '../core/constants';
import type { CongViec } from '../core/types';

interface Props {
  record: CongViec;
  /** Công việc con của record (đã lọc sẵn ở trang preview) */
  congViecCon?: CongViec[];
  /** Tra tên nhân viên theo id – trang preview truyền vào để component thuần hiển thị */
  getEmployeeName: (id: number | string | null | undefined) => string;
}

const CongViecPreviewContent: React.FC<Props> = ({ record, congViecCon = [], getEmployeeName }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());

  /** Hàm render (không phải component) để React không phải remount mỗi lần render lại trang */
  const renderRow = (label: string, value: React.ReactNode) => (
    <tr key={label}>
      <td className="w-[32%] border border-gray-300 p-1.5 text-[10pt] font-semibold text-gray-600 bg-gray-50/50 align-top">
        {label}
      </td>
      <td className="border border-gray-300 p-1.5 text-[10pt] text-gray-900 align-top whitespace-pre-line break-words">
        {value || '—'}
      </td>
    </tr>
  );

  return (
    <div className="cong-viec-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
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
              {companyInfo.email && <span>{t('company.email')}: {companyInfo.email}</span>}
              {companyInfo.email && companyInfo.phone && ' · '}
              {companyInfo.phone && <span>{t('company.phone')}: {companyInfo.phone}</span>}
            </p>
          )}
        </div>
      </div>

      <h1 className="text-center text-[16pt] font-bold mb-2 uppercase">{t('congViec.preview.title')}</h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">{record.tieu_de}</p>
      <hr className="border-t border-gray-300 my-3" />

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('congViec.form.basicInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          {renderRow(t('congViec.form.tieuDe'), record.tieu_de)}
          {renderRow(t('congViec.form.nguoiGiao'), getEmployeeName(record.id_nguoi_giao))}
          {renderRow(t('congViec.form.trachNhiem'), getEmployeeName(record.trach_nhiem))}
          {renderRow(t('congViec.form.nguoiHoTro'), (record.nguoi_ho_tro ?? []).map((id) => getEmployeeName(id)).join(', '))}
          {renderRow(t('congViec.form.uuTien'), getUuTienLabel(record.uu_tien, t))}
          {renderRow(t('congViec.form.trangThai'), getTrangThaiLabel(record.trang_thai, t))}
          {renderRow(t('congViec.form.moTa'), record.mo_ta?.trim())}
          {renderRow(t('congViec.detail.ketQua'), record.ket_qua?.trim())}
          {renderRow(t('congViec.detail.linkKetQua'), record.link_ket_qua?.trim())}
          {renderRow(t('congViec.detail.createdAt'), formatDateTimeShort(record.tg_tao))}
          {renderRow(t('congViec.store.updatedCol'), formatDateTimeShort(record.tg_cap_nhat))}
        </tbody>
      </table>

      {congViecCon.length > 0 && (
        <table className="w-full border-collapse mt-4 text-[10pt]">
          <thead>
            <tr>
              <th colSpan={3} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                {t('congViec.detail.conList')}
              </th>
            </tr>
            <tr>
              <th className="w-[8%] border border-gray-300 p-1.5 text-[9pt] font-semibold text-gray-600 bg-gray-50/50">
                #
              </th>
              <th className="border border-gray-300 p-1.5 text-left text-[9pt] font-semibold text-gray-600 bg-gray-50/50">
                {t('congViec.store.tieuDeCol')}
              </th>
              <th className="w-[26%] border border-gray-300 p-1.5 text-left text-[9pt] font-semibold text-gray-600 bg-gray-50/50">
                {t('congViec.store.trangThaiCol')}
              </th>
            </tr>
          </thead>
          <tbody>
            {congViecCon.map((c, i) => (
              <tr key={c.id}>
                <td className="border border-gray-300 p-1.5 text-center tabular-nums">{i + 1}</td>
                <td className="border border-gray-300 p-1.5">{c.tieu_de}</td>
                <td className="border border-gray-300 p-1.5">{getTrangThaiLabel(c.trang_thai, t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-[7pt] text-gray-500 mt-5">
        {t('congViec.preview.printedAt')} {printedAt}
      </p>
    </div>
  );
};

export default CongViecPreviewContent;
