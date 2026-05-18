import React from 'react';
import { useTranslation } from 'react-i18next';
import { getKiemKeKhoPreviewSignLabels } from '../core/kkk-preview-layout';

const PhieuKiemKeKhoPreviewSignFooter: React.FC = () => {
  const { t } = useTranslation();
  const labels = getKiemKeKhoPreviewSignLabels(t);

  return (
    <div className="kiem-ke-kho-print-sign-footer grid grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-300">
      {labels.map((label) => (
        <div key={label} className="text-center">
          <p className="text-[10pt] font-semibold text-gray-800 mb-0.5">{label}</p>
          <p className="text-[8pt] text-gray-500">{t('kiemKeKho.preview.signHint')}</p>
        </div>
      ))}
    </div>
  );
};

export default PhieuKiemKeKhoPreviewSignFooter;
