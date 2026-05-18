import React from 'react';
import { useTranslation } from 'react-i18next';
import { getDbsdtPreviewSignLabels } from '../core/dbsdt-preview-layout';

const DuBaoSlDongThungPreviewSignFooter: React.FC = () => {
  const { t } = useTranslation();
  const labels = getDbsdtPreviewSignLabels(t);

  return (
    <div className="grid grid-cols-4 gap-3 mt-6 pt-3 border-t border-gray-300">
      {labels.map((label) => (
        <div key={label} className="text-center">
          <p className="text-[9pt] font-semibold text-gray-800 mb-0.5">{label}</p>
          <p className="text-[7.5pt] text-gray-500">{t('duBaoSlDongThung.preview.signHint')}</p>
          <div className="mt-8 border-b border-gray-400 w-4/5 mx-auto" />
        </div>
      ))}
    </div>
  );
};

export default DuBaoSlDongThungPreviewSignFooter;
