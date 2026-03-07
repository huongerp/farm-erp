/**
 * Nội dung in phiếu thu / phiếu chi / phiếu chuyển quỹ – chuẩn văn bản Việt Nam.
 * Header: thông tin công ty (logo, tên đơn vị, địa chỉ, MST, SĐT, Email).
 * Thân: tiêu đề phiếu, bảng thông tin, phần chữ ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { ThuChi } from '../../core/types';

interface Props {
  data: ThuChi;
}

const TableRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <tr>
    <td className="w-[38%] border border-gray-300 p-2 text-[11pt] font-semibold text-gray-700 bg-gray-50/80">
      {label}
    </td>
    <td className="border border-gray-300 p-2 text-[11pt] text-gray-900">{value ?? '—'}</td>
  </tr>
);

const ThuChiPhieuPreviewContent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());

  const loaiLabel =
    data.loai === 'thu'
      ? t('thuChi.loaiThu')
      : data.loai === 'chi'
        ? t('thuChi.loaiChi')
        : t('thuChi.loaiChuyenQuy');
  const titlePhiếu =
    data.loai === 'thu'
      ? 'PHIẾU THU'
      : data.loai === 'chi'
        ? 'PHIẾU CHI'
        : 'PHIẾU CHUYỂN QUỸ';

  return (
    <div className="thu-chi-phieu-preview-content bg-white text-gray-900 font-sans text-[11pt] p-6 min-h-full">
      {/* ========== PHẦN ĐẦU TRANG – THÔNG TIN ĐƠN VỊ (theo quy định văn bản VN) ========== */}
      <div className="flex items-start gap-4 pb-3 mb-3 border-b-2 border-gray-800">
        {companyInfo.appLogo && (
          <img
            src={companyInfo.appLogo}
            alt="Logo"
            className="w-16 h-16 object-contain shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[13pt] font-bold text-gray-900 uppercase tracking-tight leading-tight">
            {companyInfo.companyName}
          </h2>
          {companyInfo.address && (
            <p className="text-[10pt] text-gray-700 mt-1">
              {t('company.address')}: {companyInfo.address}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-0 text-[10pt] text-gray-700 mt-0.5">
            {companyInfo.taxId && (
              <span>
                {t('company.taxId')}: {companyInfo.taxId}
              </span>
            )}
            {companyInfo.phone && (
              <span>
                {t('company.phone')}: {companyInfo.phone}
              </span>
            )}
            {companyInfo.email && (
              <span>
                {t('company.email')}: {companyInfo.email}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 text-[10pt] text-gray-600">
          <p className="font-semibold">{data.ma_giao_dich}</p>
          <p>{formatDate(data.ngay_giao_dich)}</p>
        </div>
      </div>

      {/* ========== TIÊU ĐỀ VĂN BẢN ========== */}
      <h1 className="text-center text-[14pt] font-bold uppercase tracking-wide my-4">
        {titlePhiếu}
      </h1>
      <p className="text-center text-[10pt] text-gray-600 mb-4">
        {loaiLabel} · {data.ma_giao_dich}
      </p>
      <hr className="border-t border-gray-300 my-3" />

      {/* ========== NỘI DUNG CHI TIẾT ========== */}
      <table className="w-full border-collapse my-2 text-[11pt]">
        <tbody>
          <TableRow label={t('thuChi.columns.maGiaoDich')} value={data.ma_giao_dich} />
          <TableRow label={t('thuChi.columns.ngayGiaoDich')} value={formatDate(data.ngay_giao_dich)} />
          <TableRow label={t('thuChi.columns.loai')} value={loaiLabel} />
          <TableRow label={t('thuChi.columns.taiKhoan')} value={data.ten_tai_khoan} />
          {data.loai !== 'chuyen_quy' && data.ten_danh_muc != null && (
            <TableRow label={t('thuChi.columns.danhMuc')} value={data.ten_danh_muc} />
          )}
          {data.loai === 'chuyen_quy' && (
            <>
              <TableRow label={t('thuChi.columns.taiKhoanDich')} value={data.ten_tai_khoan_dich} />
              {data.phi_giao_dich != null && data.phi_giao_dich > 0 && (
                <TableRow
                  label={t('thuChi.form.phiGiaoDich')}
                  value={formatCurrency(data.phi_giao_dich)}
                />
              )}
            </>
          )}
          <TableRow
            label={t('thuChi.columns.soTien')}
            value={formatCurrency(data.so_tien)}
          />
          <TableRow label={t('thuChi.columns.noiDung')} value={data.noi_dung} />
          <TableRow label={t('thuChi.columns.nguoiThucHien')} value={data.ten_nhan_vien} />
          <TableRow
            label={t('thuChi.columns.trangThai')}
            value={
              data.trang_thai === 'hoan_thanh'
                ? t('thuChi.status.hoanThanh')
                : data.trang_thai === 'cho_duyet'
                  ? t('thuChi.status.choDuyet')
                  : t('thuChi.status.huy')
            }
          />
          {data.so_phieu_de_xuat && (
            <TableRow label={t('thuChi.columns.lienKetDeXuat')} value={data.so_phieu_de_xuat} />
          )}
        </tbody>
      </table>

      {/* ========== PHẦN CHỮ KÝ (theo quy định văn bản) ========== */}
      <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-300">
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-1">
            {t('thuChi.preview.nguoiLap')}
          </p>
          <p className="text-[9pt] text-gray-500 italic mt-8">(Ký, ghi rõ họ tên)</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-1">
            {t('thuChi.preview.keToanTruong')}
          </p>
          <p className="text-[9pt] text-gray-500 italic mt-8">(Ký, ghi rõ họ tên)</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-1">
            {t('thuChi.preview.thuTruongDonVi')}
          </p>
          <p className="text-[9pt] text-gray-500 italic mt-8">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>

      {/* ========== NGÀY IN ========== */}
      <p className="text-[9pt] text-gray-500 mt-6 text-right">
        {t('thuChi.preview.printedAt')} {printedAt}
      </p>
    </div>
  );
};

export default ThuChiPhieuPreviewContent;
