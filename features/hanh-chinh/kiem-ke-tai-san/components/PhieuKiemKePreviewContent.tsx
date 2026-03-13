/**
 * Nội dung in phiếu kiểm kê A4 – header công ty + thông tin đợt + danh sách chi tiết.
 * Dùng cho trang preview /phieu-kiem-ke/:id và in (chuẩn như hồ sơ tài sản).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiDotLabel, getKetQuaLabel } from '../core/constants';
import type { DotKiemKe, ChiTietKiemKe } from '../core/types';

interface Props {
  dot: DotKiemKe;
  chiTiet: ChiTietKiemKe[];
}

const PhieuKiemKePreviewContent: React.FC<Props> = ({ dot, chiTiet }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());

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
    <div className="phieu-kiem-ke-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
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
        {t('kiemKeTaiSan.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {dot.ma_dot} · {dot.ten_dot} · {getTrangThaiDotLabel(dot.trang_thai)}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('kiemKeTaiSan.form.infoSection')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('kiemKeTaiSan.store.maDotCol')} value={dot.ma_dot} />
          <TableRow label={t('kiemKeTaiSan.store.tenDotCol')} value={dot.ten_dot} />
          <TableRow label={t('kiemKeTaiSan.store.ngayBatDauCol')} value={formatDate(dot.ngay_bat_dau)} />
          <TableRow label={t('kiemKeTaiSan.store.ngayKetThucCol')} value={formatDate(dot.ngay_ket_thuc)} />
          <TableRow
            label={t('kiemKeTaiSan.store.trangThaiCol')}
            value={getTrangThaiDotLabel(dot.trang_thai)}
          />
          <TableRow
            label={t('kiemKeTaiSan.store.nguoiPhuTrachCol')}
            value={dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach}
          />
          <TableRow label={t('kiemKeTaiSan.store.ghiChuCol')} value={dot.ghi_chu} />
        </tbody>
      </table>

      {chiTiet.length > 0 && (
        <>
          <h2 className="text-[11pt] font-semibold mt-4 mb-2 text-gray-900">
            {t('kiemKeTaiSan.chiTietSection')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10pt]">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('kiemKeTaiSan.store.taiSanCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('kiemKeTaiSan.store.noiLuuSoCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('kiemKeTaiSan.store.nguoiGiuSoCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('kiemKeTaiSan.store.ketQuaCol')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chiTiet.map((c) => (
                  <tr key={c.id}>
                    <td className="border border-gray-300 p-1.5 text-gray-900">
                      {(c.ten_tai_san || c.ma_tai_san) ?? '—'}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-gray-900">
                      {c.ten_noi_luu_so ?? '—'}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-gray-900">
                      {c.ten_nguoi_giu_so ?? '—'}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-gray-900">
                      {getKetQuaLabel(c.ket_qua)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-[7pt] text-gray-500 mt-5">
        {t('kiemKeTaiSan.preview.printedAt')} {printedAt}
      </p>
    </div>
  );
};

export default PhieuKiemKePreviewContent;
