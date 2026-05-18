/**
 * Nội dung in báo cáo nhân công A4 dọc — header công ty + tổng quan + bảng chuyền + chữ ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCong } from '../core/types';
import { bcncTrangThaiLabel } from '../core/bcnc-preview-layout';
import { formatDateShort, formatDateTime } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import BaoCaoNhanCongPreviewOverview from './BaoCaoNhanCongPreviewOverview';
import BaoCaoNhanCongPreviewTable from './BaoCaoNhanCongPreviewTable';
import BaoCaoNhanCongPreviewSignFooter from './BaoCaoNhanCongPreviewSignFooter';

interface Props {
  data: FarmBaoCaoNhanCong;
}

const BaoCaoNhanCongPreviewContent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const trangThaiLabel = bcncTrangThaiLabel(data, t);

  return (
    <div className="bao-cao-nhan-cong-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 min-h-full w-[210mm] max-w-[210mm] box-border flex flex-col">
      <div className="flex items-start gap-3 pb-3 mb-3 border-b-2 border-gray-300">
        {companyInfo.appLogo && (
          <img src={companyInfo.appLogo} alt="Logo" className="w-14 h-14 object-contain shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[13pt] font-bold text-gray-900 uppercase tracking-tight">
            {companyInfo.companyName}
          </h2>
          {companyInfo.address && (
            <p className="text-[8pt] text-gray-600 mt-0.5">
              {t('company.address')}: {companyInfo.address}
            </p>
          )}
        </div>
      </div>

      <h1 className="text-center text-[14pt] font-bold mb-1 uppercase">{t('baoCaoNhanCong.preview.title')}</h1>
      <p className="text-center text-[9pt] text-gray-500 mb-3">
        {formatDateShort(data.ngay)}
        {data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''} · {trangThaiLabel}
      </p>

      <BaoCaoNhanCongPreviewOverview data={data} />

      <h2 className="text-[10pt] font-semibold mb-1.5 text-gray-900">{t('baoCaoNhanCong.form.sectionChuyen')}</h2>
      <BaoCaoNhanCongPreviewTable data={data} />

      <BaoCaoNhanCongPreviewSignFooter />

      <footer className="mt-auto pt-3 border-t border-gray-200">
        <p className="text-[7pt] text-gray-500 m-0">
          {t('baoCaoNhanCong.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default BaoCaoNhanCongPreviewContent;
