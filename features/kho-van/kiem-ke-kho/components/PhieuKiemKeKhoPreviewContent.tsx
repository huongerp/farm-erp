/**
 * Nội dung in phiếu kiểm kê kho A4 — header công ty + thông tin đợt + thống kê + bảng chi tiết 8 cột + footer ký.
 * Đây là nguồn WYSIWYG cho window.print(); nội dung phải khớp với file PDF/DOC/XLSX export.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel, getKetQuaLabel } from '../core/constants';
import {
  getKiemKeKhoChiTietStats,
  buildKiemKeKhoStatsText,
  formatKiemKeKhoQty,
  getKiemKeKhoVariance,
} from '../core/kkk-preview-layout';
import PhieuKiemKeKhoPreviewSignFooter from './PhieuKiemKeKhoPreviewSignFooter';
import type { DotKiemKeKho, ChiTietKiemKeKho } from '../core/types';

interface Props {
  dot: DotKiemKeKho;
  chiTiet: ChiTietKiemKeKho[];
}

const PhieuKiemKeKhoPreviewContent: React.FC<Props> = ({ dot, chiTiet }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const stats = getKiemKeKhoChiTietStats(chiTiet);

  const InfoRow = ({
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
    <div className="phieu-kiem-ke-kho-preview-content bg-white text-gray-900 font-sans text-[10pt] pt-[15mm] pr-[15mm] pb-[15mm] pl-[20mm] print:p-0">
      {/* Company header */}
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

      {/* Title */}
      <h1 className="text-center text-[16pt] font-bold mb-2 uppercase">
        {t('kiemKeKho.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {dot.ma_dot} · {dot.ten_dot} · {getTrangThaiDotLabel(dot.trang_thai, t)}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      {/* Dot info table */}
      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th
              colSpan={2}
              className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold"
            >
              {t('kiemKeKho.form.infoSection')}
            </th>
          </tr>
        </thead>
        <tbody>
          <InfoRow label={t('kiemKeKho.store.maDotCol')} value={dot.ma_dot} />
          <InfoRow label={t('kiemKeKho.store.tenDotCol')} value={dot.ten_dot} />
          <InfoRow label={t('kiemKeKho.store.ngayBatDauCol')} value={formatDate(dot.ngay_bat_dau)} />
          <InfoRow label={t('kiemKeKho.store.ngayKetThucCol')} value={formatDate(dot.ngay_ket_thuc)} />
          <InfoRow
            label={t('kiemKeKho.store.trangThaiCol')}
            value={getTrangThaiDotLabel(dot.trang_thai, t)}
          />
          <InfoRow
            label={t('kiemKeKho.store.nguoiPhuTrachCol')}
            value={dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach}
          />
          <InfoRow label={t('kiemKeKho.store.ghiChuCol')} value={dot.ghi_chu} />
        </tbody>
      </table>

      {/* Stats summary line */}
      {chiTiet.length > 0 && (
        <p className="text-[9pt] text-gray-600 mt-2">
          {buildKiemKeKhoStatsText(stats, t)}
        </p>
      )}

      {/* Detail table */}
      {chiTiet.length > 0 ? (
        <>
          <h2 className="text-[11pt] font-semibold mt-4 mb-2 text-gray-900">
            {t('kiemKeKho.chiTietSection')}
          </h2>
          <div className="overflow-x-auto">
            <table className="kiem-ke-kho-print-detail-table w-full border-collapse text-[10pt]">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-[4%]">
                    TT
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold w-[12%]">
                    {t('kiemKeKho.store.khoCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold w-[22%]">
                    {t('kiemKeKho.store.hangHoaCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-[10%]">
                    {t('kiemKeKho.store.soLuongSoCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-[10%]">
                    {t('kiemKeKho.store.soLuongThucTeCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-[10%]">
                    {t('kiemKeKho.detail.chenhLech')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold w-[10%]">
                    {t('kiemKeKho.store.ketQuaCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('kiemKeKho.store.ghiChuCol')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chiTiet.map((c, idx) => {
                  const variance = getKiemKeKhoVariance(c);
                  const varianceLabel =
                    variance == null
                      ? '—'
                      : variance > 0
                        ? `+${formatKiemKeKhoQty(variance)}`
                        : formatKiemKeKhoQty(variance);
                  return (
                    <tr key={c.id} className="break-inside-avoid">
                      <td className="border border-gray-300 p-1.5 text-gray-900 text-center tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-gray-900">
                        {(c.ten_kho || c.ma_kho) ?? '—'}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-gray-900">
                        {(c.ten_hang || c.ma_hang) ?? '—'}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-gray-900 tabular-nums text-right">
                        {formatKiemKeKhoQty(c.so_luong_so, c.don_vi_tinh)}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-gray-900 tabular-nums text-right">
                        {formatKiemKeKhoQty(c.so_luong_thuc_te, c.don_vi_tinh)}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-gray-900 tabular-nums text-right">
                        {varianceLabel}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-gray-900">
                        {getKetQuaLabel(c.ket_qua, t)}
                      </td>
                      <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">
                        {c.ghi_chu_dong ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-[10pt] text-gray-500 italic mt-4">{t('kiemKeKho.chiTietEmpty')}</p>
      )}

      {/* Signature footer */}
      <PhieuKiemKeKhoPreviewSignFooter />

      {/* Printed-at footer */}
      <footer className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-[7pt] text-gray-500">
          {t('kiemKeKho.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default PhieuKiemKeKhoPreviewContent;
