/**
 * Nội dung phiếu lương A4 – dùng cho trang preview và in
 * Header: logo + thông tin công ty (từ module Thông tin công ty)
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { BangLuongRecord } from '../core/types';

interface Props {
  record: BangLuongRecord;
}

const PayslipPreviewContent: React.FC<Props> = ({ record }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const periodStr = `${record.nam}-${String(record.thang).padStart(2, '0')}`;
  const empLabel = record.ten_nhan_vien
    ? `${record.ten_nhan_vien}${record.ma_nhan_vien ? ` (${record.ma_nhan_vien})` : ''}`
    : record.ma_nhan_vien || '—';
  const printedAt = formatDateTime(new Date());

  const TableRow = ({
    label,
    value,
    valueRight = false,
  }: {
    label: string;
    value: string | number;
    valueRight?: boolean;
  }) => (
    <tr>
      <td className="w-[40%] border border-gray-300 p-1.5 text-[10pt] font-semibold text-gray-600 bg-gray-50/50">
        {label}
      </td>
      <td
        className={`border border-gray-300 p-1.5 text-[10pt] text-gray-900 ${valueRight ? 'text-right tabular-nums' : ''}`}
      >
        {value}
      </td>
    </tr>
  );

  return (
    <div className="payslip-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
      {/* Header công ty: logo + tên đầy đủ, địa chỉ, email, SĐT */}
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

      <h1 className="text-center text-[16pt] font-bold mb-2">{t('bangLuong.pdf.title')}</h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {t('bangLuong.detail.employee')}: {empLabel} · {t('bangLuong.detail.period')}: {periodStr}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('bangLuong.pdf.basicInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('bangLuong.detail.employee')} value={empLabel} />
          <TableRow label={t('bangLuong.detail.period')} value={periodStr} />
          <TableRow label={t('bangLuong.detail.department')} value={record.ten_phong_ban || '—'} />
          <TableRow
            label={t('bangLuong.detail.ngayCong')}
            value={`${record.ngay_cong} / ${record.ngay_cong_chuan}`}
          />
        </tbody>
      </table>

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('bangLuong.pdf.salaryBreakdown')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('bangLuong.detail.luongCoBan')} value={formatCurrency(record.luong_co_ban_tinh)} valueRight />
          <TableRow label={t('bangLuong.detail.luongKpi')} value={formatCurrency(record.luong_kpi_tinh)} valueRight />
          <TableRow
            label={record.kpi_dat ? t('bangLuong.detail.kpiDat') : t('bangLuong.detail.kpiKhongDat')}
            value={`${record.diem_kpi.toFixed(1)}${record.kpi_dat ? '' : ` (${(record.ty_le_kpi_khong_dat * 100).toFixed(0)}%)`}`}
          />
          <TableRow label={t('bangLuong.detail.luongTrachNhiem')} value={formatCurrency(record.luong_trach_nhiem_tinh)} valueRight />
          <TableRow label={t('bangLuong.detail.phuCap')} value={formatCurrency(record.phu_cap_tinh)} valueRight />
        </tbody>
      </table>

      {record.cong_tru_khac && record.cong_tru_khac.length > 0 && (
        <table className="w-full border-collapse mt-3 text-[10pt]">
          <thead>
            <tr>
              <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                {t('bangLuong.detail.congTruKhac')}
              </th>
            </tr>
          </thead>
          <tbody>
            {record.cong_tru_khac.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-1.5 font-semibold text-gray-600">
                  {item.loai === 'cong' ? t('bangLuong.detail.cong') : t('bangLuong.detail.tru')}: {item.ly_do || '—'}
                </td>
                <td className="border border-gray-300 p-1.5 text-right tabular-nums">{formatCurrency(item.so_tien)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border border-gray-300 p-1.5 text-gray-600">
                {t('bangLuong.store.congTruNetCol')}
              </td>
              <td className="border border-gray-300 p-1.5 text-right tabular-nums">
                {record.cong_tru_net >= 0 ? '+' : ''}
                {formatCurrency(record.cong_tru_net)}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('bangLuong.detail.tongLuong')}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-1.5 font-bold text-gray-600">
              {t('bangLuong.detail.tongLuong')}
            </td>
            <td className="border border-gray-300 p-1.5 font-bold text-right tabular-nums text-primary">
              {formatCurrency(record.tong_luong)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Phần ký nhận */}
      <div className="mt-8 pt-4">
        <div className="grid grid-cols-4 gap-4 text-[9pt]">
          <div className="flex flex-col items-center text-center">
            <p className="font-semibold text-gray-700 mb-8">{t('bangLuong.signature.creator')}</p>
            <p className="text-gray-500 italic">{t('bangLuong.signature.signHint')}</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="font-semibold text-gray-700 mb-8">{t('bangLuong.signature.checker')}</p>
            <p className="text-gray-500 italic">{t('bangLuong.signature.signHint')}</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="font-semibold text-gray-700 mb-8">{t('bangLuong.signature.related')}</p>
            <p className="text-gray-500 italic">{t('bangLuong.signature.signHint')}</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="font-semibold text-gray-700 mb-8">{t('bangLuong.signature.approver')}</p>
            <p className="text-gray-500 italic">{t('bangLuong.signature.signHint')}</p>
          </div>
        </div>
      </div>

      <p className="text-[7pt] text-gray-500 mt-5">
        {t('bangLuong.pdf.printedAt')} {printedAt}
      </p>
    </div>
  );
};

export default PayslipPreviewContent;
