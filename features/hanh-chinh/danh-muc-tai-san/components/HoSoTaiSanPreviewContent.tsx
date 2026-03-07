/**
 * Nội dung in hồ sơ tài sản A4 – header công ty + thông tin tài sản.
 * Dùng cho trang preview /ho-so-tai-san/:id và in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { TaiSan } from '../core/types';

interface Props {
  record: TaiSan;
}

const HoSoTaiSanPreviewContent: React.FC<Props> = ({ record }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());

  const TableRow = ({
    label,
    value,
    valueRight = false,
  }: {
    label: string;
    value: string | number | null | undefined;
    valueRight?: boolean;
  }) => (
    <tr>
      <td className="w-[40%] border border-gray-300 p-1.5 text-[10pt] font-semibold text-gray-600 bg-gray-50/50">
        {label}
      </td>
      <td
        className={`border border-gray-300 p-1.5 text-[10pt] text-gray-900 ${valueRight ? 'text-right tabular-nums' : ''}`}
      >
        {value ?? '—'}
      </td>
    </tr>
  );

  return (
    <div className="ho-so-tai-san-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
      {/* Header công ty */}
      <div className="flex items-start gap-4 pb-4 mb-4 border-b-2 border-gray-300">
        {companyInfo.appLogo && (
          <img
            src={companyInfo.appLogo}
            alt="Logo"
            className="w-16 h-16 object-contain shrink-0"
          />
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

      <h1 className="text-center text-[16pt] font-bold mb-2 uppercase">
        {t('danhSachTaiSan.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {record.ma_tai_san} · {record.ten_tai_san}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      {/* Ảnh tài sản (nếu có) */}
      {record.hinh_anh && (
        <div className="flex justify-center mb-4">
          <img
            src={record.hinh_anh}
            alt={record.ten_tai_san}
            className="max-w-[120px] max-h-[120px] object-contain border border-gray-200 rounded"
          />
        </div>
      )}

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('danhSachTaiSan.form.basicInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('danhSachTaiSan.store.maCol')} value={record.ma_tai_san} />
          <TableRow label={t('danhSachTaiSan.store.tenCol')} value={record.ten_tai_san} />
          <TableRow label={t('danhSachTaiSan.store.nhomCol')} value={record.ten_nhom} />
          <TableRow label={t('danhSachTaiSan.store.noiLuuCol')} value={record.ten_noi_luu} />
          <TableRow label={t('danhSachTaiSan.store.trangThaiCol')} value={record.ten_trang_thai} />
          <TableRow
            label={t('danhSachTaiSan.store.nguoiGiuCol')}
            value={
              record.ten_nhan_vien_dang_giu
                ? `${record.ten_nhan_vien_dang_giu}${record.ma_nhan_vien_dang_giu ? ` (${record.ma_nhan_vien_dang_giu})` : ''}`
                : null
            }
          />
          <TableRow label={t('danhSachTaiSan.store.ngayNhapCol')} value={formatDate(record.ngay_nhap)} />
          <TableRow
            label={t('danhSachTaiSan.store.nguyenGiaCol')}
            value={record.nguyen_gia != null ? formatCurrency(record.nguyen_gia) : null}
            valueRight
          />
          <TableRow label={t('danhSachTaiSan.form.ghiChu')} value={record.ghi_chu} />
          <TableRow label={t('danhSachTaiSan.store.updatedCol')} value={formatDate(record.tg_cap_nhat)} />
        </tbody>
      </table>

      <p className="text-[7pt] text-gray-500 mt-5">
        {t('danhSachTaiSan.preview.printedAt')} {printedAt}
      </p>
    </div>
  );
};

export default HoSoTaiSanPreviewContent;
