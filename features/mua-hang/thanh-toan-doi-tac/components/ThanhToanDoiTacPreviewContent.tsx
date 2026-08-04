import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { ThanhToanDoiTac } from '../core/types';

interface Props {
  data: ThanhToanDoiTac;
}

const ThanhToanDoiTacPreviewContent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);

  const TableRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <tr>
      <td className="w-[40%] border border-gray-300 p-1.5 text-[10pt] font-semibold text-gray-600 bg-gray-50/50">
        {label}
      </td>
      <td className="border border-gray-300 p-1.5 text-[10pt] text-gray-900">{value ?? '—'}</td>
    </tr>
  );

  return (
    <div className="thanh-toan-doi-tac-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
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
        {t('thanhToanDoiTac.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {data.so_phieu}
        {' · '}
        {data.mau_trang_thai ? (
          <span style={{ color: data.mau_trang_thai, fontWeight: 600 }}>{data.ten_trang_thai ?? '—'}</span>
        ) : (
          (data.ten_trang_thai ?? '—')
        )}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('thanhToanDoiTac.detail.basicInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('thanhToanDoiTac.form.soPhieu')} value={data.so_phieu} />
          <TableRow label={t('thanhToanDoiTac.form.hangMuc')} value={data.hang_muc_thanh_toan} />
          <TableRow label={t('thanhToanDoiTac.form.ngay')} value={formatDate(data.ngay)} />
          <TableRow label={t('thanhToanDoiTac.form.donVi')} value={data.ten_don_vi ?? '—'} />
          <TableRow label={t('thanhToanDoiTac.store.nhomDoiTacCol')} value={data.ten_nhom ?? '—'} />
          <TableRow label={t('thanhToanDoiTac.form.doiTac')} value={data.ten_doi_tac} />
          <TableRow
            label={t('thanhToanDoiTac.form.trangThai')}
            value={
              data.mau_trang_thai ? (
                <span style={{ color: data.mau_trang_thai, fontWeight: 600 }}>{data.ten_trang_thai ?? '—'}</span>
              ) : (
                (data.ten_trang_thai ?? '—')
              )
            }
          />
          <TableRow
            label={t('thanhToanDoiTac.form.soTien')}
            value={data.so_tien != null ? data.so_tien.toLocaleString('vi-VN') : null}
          />
          <TableRow label={t('thanhToanDoiTac.form.ngayXuLy')} value={data.ngay_xu_ly ? formatDate(data.ngay_xu_ly) : null} />
          <TableRow label={t('thanhToanDoiTac.form.ghiChu')} value={data.ghi_chu} />
          <TableRow label={t('thanhToanDoiTac.form.nguoiTao')} value={data.ten_nguoi_tao} />
        </tbody>
      </table>
      <p className="text-[7pt] text-gray-500 mt-6 font-sans">
        {t('thanhToanDoiTac.preview.printedAt')} {formatDateTime(new Date())}
      </p>
    </div>
  );
};

export default ThanhToanDoiTacPreviewContent;
