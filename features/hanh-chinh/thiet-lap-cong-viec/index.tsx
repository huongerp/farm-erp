import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, FileText } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import CanhBaoTab from './components/canh-bao-tab';
import MauCongViecTab from './components/mau-cong-viec-tab';

const ThietLapCongViecPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('canh-bao');

  const tabs = useMemo(
    () => [
      { id: 'canh-bao', label: t('thietLapCongViec.tabs.canhBao'), icon: Bell },
      { id: 'mau', label: t('thietLapCongViec.tabs.mauCongViec'), icon: FileText },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'canh-bao' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <CanhBaoTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <MauCongViecTab />
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default ThietLapCongViecPage;
