import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateVietnameseLong, formatDateTime, formatNumberVN } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import type { PhieuKhoPT, PhieuKhoPTChiTiet, LoaiPhieuKhoPT } from '../core/types';

function getTitleUppercase(loai: LoaiPhieuKhoPT): string {
  const loaiUpper = loai === 'nhập' ? 'NHẬP' : loai === 'xuất' ? 'XUẤT' : 'LUÂN CHUYỂN';
  return `PHIẾU ${loaiUpper} KHO PHÂN THUỐC`;
}

function getTrangThaiLabel(trangThai: string, t: (k: string) => string): string {
  const key =
    trangThai === 'Chờ duyệt'
      ? 'phieuKhoPhanThuoc.status.pending'
      : trangThai === 'Đã duyệt'
        ? 'phieuKhoPhanThuoc.status.approved'
        : 'phieuKhoPhanThuoc.status.rejected';
  return t(key);
}

function getNoiDiNoiDen(phieu: PhieuKhoPT): { noiDi: string; noiDen: string } {
  switch (phieu.loai) {
    case 'nhập':
      return { noiDi: '—', noiDen: phieu.ten_kho ?? phieu.kho_id ?? '—' };
    case 'xuất':
      return { noiDi: phieu.ten_kho ?? phieu.kho_id ?? '—', noiDen: '—' };
    case 'chuyển':
      return { noiDi: phieu.ten_kho ?? phieu.kho_id ?? '—', noiDen: phieu.ten_kho_den ?? '—' };
    default:
      return { noiDi: '—', noiDen: '—' };
  }
}

interface Props {
  phieu: PhieuKhoPT;
}

const PhieuKhoPTPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const chiTiet: PhieuKhoPTChiTiet[] = phieu.chi_tiet ?? [];
  const { noiDi, noiDen } = getNoiDiNoiDen(phieu);

  return (
    <div className="phieu-kho-pt-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full flex flex-col">
      <div className="flex items-start gap-4 pb-4 mb-4 border-b-2 border-gray-300">
        {companyInfo.appLogo && (
          <img src={companyInfo.appLogo} alt="Logo" className="w-16 h-16 object-contain shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[14pt] font-bold text-gray-900 uppercase tracking-tight">{companyInfo.companyName}</h2>
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

      <p className="text-[10pt] text-gray-700 mb-1 text-left font-normal not-italic">{formatDateVietnameseLong(phieu.ngay)}</p>

      <h1 className="text-center text-[16pt] font-bold mb-1 uppercase">{getTitleUppercase(phieu.loai)}</h1>
      <p className="text-center text-[10pt] text-gray-600 mb-4">
        ({t('phieuKhoPhanThuoc.form.code')}: {phieu.so_phieu})
      </p>

      <div className="grid grid-cols-2 gap-4 text-[10pt] mb-3">
        <div>
          <span className="font-semibold text-gray-600">{t('phieuKhoPhanThuoc.preview.noiDi')}: </span>
          <span className="text-gray-900">{noiDi}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-600">{t('phieuKhoPhanThuoc.preview.noiDen')}: </span>
          <span className="text-gray-900">{noiDen}</span>
        </div>
      </div>

      <p className="text-[10pt] mb-1">
        <span className="font-semibold text-gray-600">{t('phieuKhoPhanThuoc.form.description')}: </span>
        <span className="text-gray-900">{phieu.mo_ta ?? '—'}</span>
      </p>

      <p className="text-[10pt] mb-4">
        <span className="font-semibold text-gray-600">{t('phieuKhoPhanThuoc.store.statusCol')}: </span>
        <span className="text-gray-900">{getTrangThaiLabel(phieu.trang_thai, t)}</span>
      </p>

      <h2 className="text-[11pt] font-semibold mt-2 mb-2 text-gray-900">{t('phieuKhoPhanThuoc.preview.danhSachChiTiet')}</h2>
      {chiTiet.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10pt]">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-10">TT</th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuKhoPhanThuoc.preview.danhMuc')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuKhoPhanThuoc.form.itemName')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-16">
                  {t('phieuKhoPhanThuoc.form.unit')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-right text-[9pt] font-bold w-20">
                  {t('phieuKhoPhanThuoc.form.quantity')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-center text-[9pt] font-bold w-20">
                  {t('phieuKhoPhanThuoc.preview.soLot')}
                </th>
                <th className="border border-gray-300 bg-primary text-white p-1.5 text-left text-[9pt] font-bold">
                  {t('phieuKhoPhanThuoc.form.note')}
                </th>
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((c, idx) => (
                <tr key={c.id}>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900 text-[9pt]">{c.ten_danh_muc ?? '—'}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-900">{c.ten_hang ?? c.ten_hang_hoa ?? '—'}</td>
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
                  {t('phieuKhoPhanThuoc.preview.totalQty')}
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
        <p className="text-[10pt] text-gray-500 italic">{t('phieuKhoPhanThuoc.form.noItems')}</p>
      )}

      <div className="grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-300">
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKhoPhanThuoc.preview.signCreator')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKhoPhanThuoc.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKhoPhanThuoc.preview.signChecker')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKhoPhanThuoc.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKhoPhanThuoc.preview.signRelated')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKhoPhanThuoc.preview.signHint')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{t('phieuKhoPhanThuoc.preview.signApprover')}</p>
          <p className="text-[8pt] text-gray-500">{t('phieuKhoPhanThuoc.preview.signHint')}</p>
        </div>
      </div>

      <footer className="mt-auto pt-4 border-t border-gray-200 print:mt-8">
        <p className="text-[7pt] text-gray-500 text-left">
          {t('phieuKhoPhanThuoc.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default PhieuKhoPTPreviewContent;
