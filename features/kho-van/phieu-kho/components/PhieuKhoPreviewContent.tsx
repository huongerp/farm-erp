/**
 * Nội dung in phiếu kho A4 – theo mẫu bản in phiếu kho (nhập/xuất/chuyển thống nhất).
 * Bố cục: header công ty, ngày, tiêu đề PHIẾU [LOẠI] KHO, mã phiếu, Nơi đi/Nơi đến, Ghi chú, Trạng thái, bảng chi tiết (TT, Danh mục, Tên hàng, ĐVT, SL, Số LOT, Ghi chú), 4 ô chữ ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateVietnameseLong, formatDateTime, formatNumberVN } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { PhieuKho, PhieuKhoChiTiet, LoaiPhieuKho } from '../core/types';

function getLoaiLabel(loai: LoaiPhieuKho, t: (k: string) => string): string {
  const key = loai === 'nhập' ? 'phieuKho.tabs.nhap' : loai === 'xuất' ? 'phieuKho.tabs.xuat' : 'phieuKho.tabs.chuyen';
  return t(key);
}

function getTrangThaiLabel(trangThai: string, t: (k: string) => string): string {
  const key = trangThai === 'Chờ duyệt' ? 'phieuKho.status.pending' : trangThai === 'Đã duyệt' ? 'phieuKho.status.approved' : 'phieuKho.status.rejected';
  return t(key);
}

/** Nơi đi / Nơi đến theo loại phiếu (nhập: NCC→Kho, xuất: Kho→KH, chuyển: Kho→Kho đến). */
function getNoiDiNoiDen(phieu: PhieuKho): { noiDi: string; noiDen: string } {
  switch (phieu.loai) {
    case 'nhập':
      return { noiDi: phieu.ten_nha_cung_cap ?? '—', noiDen: phieu.ten_kho ?? phieu.kho_id ?? '—' };
    case 'xuất':
      return { noiDi: phieu.ten_kho ?? phieu.kho_id ?? '—', noiDen: phieu.ten_khach_hang ?? '—' };
    case 'chuyển':
      return { noiDi: phieu.ten_kho ?? phieu.kho_id ?? '—', noiDen: phieu.ten_kho_den ?? '—' };
    default:
      return { noiDi: '—', noiDen: '—' };
  }
}

/** Tiêu đề phiếu: PHIẾU NHẬP KHO / PHIẾU XUẤT KHO / PHIẾU CHUYỂN KHO (chỉ một chữ KHO). */
function getTitleUppercase(loai: LoaiPhieuKho): string {
  const loaiUpper = loai === 'nhập' ? 'NHẬP' : loai === 'xuất' ? 'XUẤT' : 'CHUYỂN';
  return `PHIẾU ${loaiUpper} KHO`;
}

interface Props {
  phieu: PhieuKho;
}

const PhieuKhoPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const chiTiet: PhieuKhoChiTiet[] = phieu.chi_tiet ?? [];
  const { noiDi, noiDen } = getNoiDiNoiDen(phieu);

  return (
    <div className="phieu-kho-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full flex flex-col">
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

      {/* Ngày (dạng "Ngày dd tháng mm năm yyyy") - căn trái, không nghiêng */}
      <p className="text-[10pt] text-gray-700 mb-1 text-left font-normal not-italic">
        {formatDateVietnameseLong(phieu.ngay)}
      </p>

      {/* Tiêu đề: PHIẾU NHẬP KHO (chỉ một chữ KHO) */}
      <h1 className="text-center text-[16pt] font-bold mb-1 uppercase">
        {getTitleUppercase(phieu.loai)}
      </h1>
      <p className="text-center text-[10pt] text-gray-600 mb-4">
        ({t('phieuKho.form.code')}: {phieu.so_phieu})
      </p>

      {phieu.loai === 'nhập' && (phieu.so_po_don_dat_hang?.trim() || phieu.id_don_dat_hang) ? (
        <p className="text-center text-[10pt] text-gray-700 mb-3">
          <span className="font-semibold">{t('phieuKho.detail.linkPo')}: </span>
          <span className="font-mono">{phieu.so_po_don_dat_hang?.trim() || (phieu.id_don_dat_hang ? `#${phieu.id_don_dat_hang}` : '—')}</span>
        </p>
      ) : null}

      {/* Nơi đi – Nơi đến (một dòng) */}
      <div className="grid grid-cols-2 gap-4 text-[10pt] mb-3">
        <div>
          <span className="font-semibold text-gray-600">{t('phieuKho.preview.noiDi')}: </span>
          <span className="text-gray-900">{noiDi}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">{t('phieuKho.preview.noiDen')}: </span>
          <span className="text-gray-900">{noiDen}</span>
        </div>
      </div>

      {/* Ghi chú */}
      <p className="text-[10pt] mb-1">
        <span className="font-semibold text-gray-600">{t('phieuKho.form.description')}: </span>
        <span className="text-gray-900">{phieu.mo_ta ?? '—'}</span>
      </p>

      {/* Trạng thái */}
      <p className="text-[10pt] mb-4">
        <span className="font-semibold text-gray-600">{t('phieuKho.store.statusCol')}: </span>
        <span className="text-gray-900">{getTrangThaiLabel(phieu.trang_thai, t)}</span>
      </p>

      {/* Bảng chi tiết: TT, Danh mục, Tên hàng hóa, ĐVT, SL, Số LOT, Ghi chú (thống nhất cho nhập/xuất/chuyển) */}
      <h2 className="text-[11pt] font-semibold mt-2 mb-2 text-gray-900">
        {t('phieuKho.preview.danhSachChiTiet')}
      </h2>
      {chiTiet.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-10">
                  TT
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuKho.preview.danhMuc')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuKho.form.itemName')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-16">
                  {t('phieuKho.form.unit')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-20">
                  {t('phieuKho.form.quantity')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-20">
                  {t('phieuKho.preview.soLot')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuKho.form.note')}
                </th>
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((c, idx) => (
                <tr key={c.id}>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">
                    {c.ten_danh_muc ?? '—'}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-gray-900">{c.ten_hang ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-center">{c.don_vi_tinh ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 tabular-nums text-right">{formatNumberVN(c.so_luong)}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-center text-[9pt]">{c.so_lot ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">{c.ghi_chu ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold text-gray-900">
                <td colSpan={4} className="border border-gray-300 p-1.5 text-[10pt]">
                  {t('phieuKho.preview.totalQty')}
                </td>
                <td className="border border-gray-300 p-1.5 text-[10pt] tabular-nums text-right">
                  {formatNumberVN(chiTiet.reduce((s, c) => s + (Number(c.so_luong) || 0), 0))}
                </td>
                <td colSpan={2} className="border border-gray-300 p-1.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="text-[10pt] text-gray-500 italic">{t('phieuKho.form.noItems')}</p>
      )}

      {/* Bốn ô chữ ký - tên và (Ký và ghi rõ họ tên) sát nhau */}
      <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-300">
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKho.preview.signCreator')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKho.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKho.preview.signChecker')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKho.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKho.preview.signRelated')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKho.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKho.preview.signApprover')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKho.preview.signHint')}</p>
        </div>
      </div>

      {/* Footer: In lúc nằm ở cuối trang */}
      <footer className="mt-auto pt-4 border-t border-gray-200 print:mt-8">
        <p className="text-[7pt] text-gray-500 text-left">
          {t('phieuKho.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default PhieuKhoPreviewContent;
