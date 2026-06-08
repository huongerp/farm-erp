import React, { useEffect } from 'react';
import DanhSachTab from './components/DanhSachTab';
import { ensureFeatureLocale } from '../../../lib/i18n-feature-locales';

const PhieuKiemKePage: React.FC = () => {
  useEffect(() => {
    void ensureFeatureLocale('phieu-kiem-ke');
  }, []);
  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        <DanhSachTab />
      </div>
    </div>
  );
};

export default PhieuKiemKePage;
