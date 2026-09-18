import React from 'react';
import { useTranslation } from 'react-i18next';
import { getBcncPreviewSignLabels } from '../core/bcnc-preview-layout';

const BaoCaoNhanCongPreviewSignFooter: React.FC = () => {
  const { t } = useTranslation();
  const labels = getBcncPreviewSignLabels(t);

  return (
    <div className="grid grid-cols-4 gap-3 mt-6 pt-3 border-t border-gray-300">
      {labels.map((label) => (
        <div key={label} className="text-center">
          <p className="text-[9pt] font-semibold text-gray-800 mb-0.5">{label}</p>
          <p className="text-[7.5pt] text-gray-500">{t('baoCaoNhanCong.preview.signHint')}</p>
        </div>
      ))}
    </div>
  );
};

export default BaoCaoNhanCongPreviewSignFooter;
