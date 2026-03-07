import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Tag } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import LoaiTaiLieuTab from './components/loai-tai-lieu-tab';
import TrangThaiTaiLieuTab from './components/trang-thai-tai-lieu-tab';

const ThietLapTaiLieuPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('loai');

  const tabs = useMemo(
    () => [
      { id: 'loai', label: t('thietLapTaiLieu.tabs.loaiTaiLieu'), icon: FileText },
      { id: 'trang-thai', label: t('thietLapTaiLieu.tabs.trangThai'), icon: Tag },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          {activeTab === 'loai' ? <LoaiTaiLieuTab /> : <TrangThaiTaiLieuTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ThietLapTaiLieuPage;
