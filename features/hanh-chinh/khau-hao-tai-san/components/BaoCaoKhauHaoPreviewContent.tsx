/**
 * Nội dung in báo cáo kỳ khấu hao A4 – header công ty + thông tin kỳ + bảng chi tiết.
 * Dùng cho trang preview /bao-cao-khau-hao/:id và in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime, formatCurrency } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import { getTrangThaiKyLabel } from '../core/constants';
import type { KyKhauHao, ChiTietKhauHao } from '../core/types';

interface Props {
  ky: KyKhauHao;
  chiTiet: ChiTietKhauHao[];
}

const BaoCaoKhauHaoPreviewContent: React.FC<Props> = ({ ky, chiTiet }) => {
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
    <div className="bao-cao-khau-hao-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full">
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
        {t('khauHaoTaiSan.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-500 mb-3">
        {t('khauHaoTaiSan.store.thangCol')} {ky.thang} / {ky.nam} · {getTrangThaiKyLabel(ky.trang_thai, t)}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('khauHaoTaiSan.preview.kyInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('khauHaoTaiSan.store.thangCol')} value={ky.thang} />
          <TableRow label={t('khauHaoTaiSan.store.namCol')} value={ky.nam} />
          <TableRow
            label={t('khauHaoTaiSan.store.trangThaiCol')}
            value={getTrangThaiKyLabel(ky.trang_thai, t)}
          />
          <TableRow
            label={t('khauHaoTaiSan.store.tongNguyenGiaCol')}
            value={ky.tong_nguyen_gia != null ? formatCurrency(ky.tong_nguyen_gia) : '—'}
          />
          <TableRow
            label={t('khauHaoTaiSan.store.tongKhauHaoKyCol')}
            value={ky.tong_khau_hao_ky != null ? formatCurrency(ky.tong_khau_hao_ky) : '—'}
          />
          <TableRow label={t('khauHaoTaiSan.preview.updatedAt')} value={ky.tg_cap_nhat ? formatDateTime(ky.tg_cap_nhat) : '—'} />
        </tbody>
      </table>

      {chiTiet.length > 0 && (
        <>
          <h2 className="text-[11pt] font-semibold mt-4 mb-2 text-gray-900">
            {t('khauHaoTaiSan.detail.chiTietSection')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10pt]">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.maTaiSanCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.tenTaiSanCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.nhomCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.nguyenGiaCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.giaTriDauKyCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.khauHaoKyCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.khauHaoLuyKeCol')}
                  </th>
                  <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold">
                    {t('khauHaoTaiSan.detail.giaTriCuoiKyCol')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chiTiet.map((c) => (
                  <tr key={c.id}>
                    <td className="border border-gray-300 p-1.5 text-gray-900">{c.ma_tai_san ?? '—'}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-900">{c.ten_tai_san ?? '—'}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-900">{c.ten_nhom ?? '—'}</td>
                    <td className="border border-gray-300 p-1.5 text-right tabular-nums">{formatCurrency(c.nguyen_gia)}</td>
                    <td className="border border-gray-300 p-1.5 text-right tabular-nums">{formatCurrency(c.gia_tri_con_lai_dau_ky)}</td>
                    <td className="border border-gray-300 p-1.5 text-right tabular-nums">{formatCurrency(c.khau_hao_ky)}</td>
                    <td className="border border-gray-300 p-1.5 text-right tabular-nums">{formatCurrency(c.khau_hao_luy_ke)}</td>
                    <td className="border border-gray-300 p-1.5 text-right tabular-nums">{formatCurrency(c.gia_tri_con_lai_cuoi_ky)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-[7pt] text-gray-500 mt-5">
        {t('khauHaoTaiSan.preview.printedAt')} {printedAt}
      </p>
    </div>
  );
};

export default BaoCaoKhauHaoPreviewContent;
