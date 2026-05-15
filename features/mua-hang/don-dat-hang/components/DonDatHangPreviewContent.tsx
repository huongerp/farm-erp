/**
 * Nội dung in đơn đặt hàng A4 – theo mẫu phiếu đề xuất vật tư.
 * Bố cục: header công ty, ngày tiếng Việt, tiêu đề + mã PO, thông tin cơ bản, bảng chi tiết hàng hóa, 4 ô chữ ký, footer (In lúc).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime, formatDateVietnameseLong } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { DonDatHang } from '../core/types';
import { TRANG_THAI_KEY } from '../core/constants';

function getTrangThaiLabel(trangThai: DonDatHang['trang_thai'], t: (k: string) => string): string {
  const key = TRANG_THAI_KEY[trangThai];
  return key ? t(`donDatHang.status.${key}`) : String(trangThai);
}

interface Props {
  po: DonDatHang;
}

const DonDatHangPreviewContent: React.FC<Props> = ({ po }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const chiTiet = po.chi_tiet ?? [];

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
    <div className="don-dat-hang-preview-content don-dat-hang-preview bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full flex flex-col">
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

      {/* Ngày dạng "Ngày dd tháng mm năm yyyy" */}
      <p className="text-[10pt] text-gray-700 mb-1 text-left font-normal not-italic">
        {formatDateVietnameseLong(po.ngay_dat)}
      </p>

      {/* Tiêu đề: ĐƠN ĐẶT HÀNG */}
      <h1 className="text-center text-[16pt] font-bold mb-1 uppercase">
        {t('donDatHang.preview.title')}
      </h1>
      <p className="text-center text-[10pt] text-gray-600 mb-4">
        ({t('donDatHang.form.code')}: {po.so_po}) · {getTrangThaiLabel(po.trang_thai, t)}
      </p>

      <table className="w-full border-collapse mt-3 text-[10pt]">
        <thead>
          <tr>
            <th colSpan={2} className="bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
              {t('donDatHang.detail.basicInfo')}
            </th>
          </tr>
        </thead>
        <tbody>
          <TableRow label={t('donDatHang.form.code')} value={po.so_po} />
          <TableRow label={t('donDatHang.form.orderDate')} value={formatDate(po.ngay_dat)} />
          <TableRow label={t('donDatHang.form.deliveryDate')} value={formatDate(po.ngay_giao_dk)} />
          <TableRow label={t('donDatHang.form.supplier')} value={po.ten_nha_cung_cap} />
          <TableRow label={t('donDatHang.form.warehouse')} value={po.ten_kho_nhan ?? '—'} />
          <TableRow label={t('donDatHang.form.linkRequest')} value={po.so_phieu_de_xuat ?? '—'} />
          <TableRow label={t('donDatHang.form.buyer')} value={po.ten_nguoi_dat} />
          <TableRow label={t('donDatHang.form.approver')} value={po.ten_nguoi_duyet ?? '—'} />
          <TableRow label={t('donDatHang.form.paymentTerms')} value={po.dieu_khoan_thanh_toan} />
          <TableRow label={t('donDatHang.form.notes')} value={po.ghi_chu} />
          <TableRow label={t('donDatHang.store.statusCol')} value={getTrangThaiLabel(po.trang_thai, t)} />
        </tbody>
      </table>

      {chiTiet.length > 0 && (
        <>
          <h3 className="text-[11pt] font-bold mt-4 mb-2">{t('donDatHang.form.itemsSection')}</h3>
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-8">#</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold min-w-[88px]">{t('donDatHang.chiTietTab.categoryLevel1Col')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold min-w-[88px]">{t('donDatHang.chiTietTab.categoryLevel2Col')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold min-w-[80px]">{t('donDatHang.form.item')} (mã)</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold min-w-[200px]">{t('donDatHang.form.item')} (tên)</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-16">{t('donDatHang.form.unit')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-20">{t('donDatHang.form.quantity')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-24">{t('donDatHang.form.unitPrice')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-28">Thành tiền</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold min-w-[120px]">{t('donDatHang.chiTietTab.purposeOfUseCol')}</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold min-w-[120px]">{t('donDatHang.form.note')}</th>
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((ct, idx) => (
                <tr key={ct.id}>
                  <td className="border border-gray-300 p-1.5 text-gray-600">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-600">{ct.ten_danh_muc_cap1 ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-600">{ct.ten_danh_muc_cap2 ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 min-w-[10rem] max-w-[14rem] truncate" title={ct.ten_hang ?? ''}>{ct.ten_hang ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-600">{ct.don_vi_tinh ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-right tabular-nums">{ct.so_luong}</td>
                  <td className="border border-gray-300 p-1.5 text-right tabular-nums">{ct.don_gia != null ? ct.don_gia.toLocaleString() : '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-right tabular-nums font-medium">{ct.thanh_tien != null ? ct.thanh_tien.toLocaleString() : '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-600 text-xs max-w-[10rem] truncate" title={ct.muc_dich_su_dung ?? ''}>
                    {ct.muc_dich_su_dung?.trim() || '—'}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-gray-600 text-xs max-w-[10rem] truncate" title={ct.ghi_chu ?? ''}>
                    {ct.ghi_chu?.trim() || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Bốn ô chữ ký */}
      <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-300">
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('donDatHang.preview.signCreator')}</p>
          <p className="text-[8pt] text-gray-500">{t('donDatHang.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('donDatHang.preview.signChecker')}</p>
          <p className="text-[8pt] text-gray-500">{t('donDatHang.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('donDatHang.preview.signRelated')}</p>
          <p className="text-[8pt] text-gray-500">{t('donDatHang.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('donDatHang.preview.signApprover')}</p>
          <p className="text-[8pt] text-gray-500">{t('donDatHang.preview.signHint')}</p>
        </div>
      </div>

      {/* Footer: In lúc */}
      <footer className="mt-auto pt-4 border-t border-gray-200 print:mt-8">
        <p className="text-[7pt] text-gray-500 text-left">
          {t('donDatHang.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default DonDatHangPreviewContent;
