import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import KyTab from './components/KyTab';
import ThongKeTab from './components/ThongKeTab';

const KhauHaoTaiSanPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ky');

  const tabs = useMemo(
    () => [
      { id: 'ky', label: t('khauHaoTaiSan.tabs.ky'), icon: Calculator },
      { id: 'stats', label: t('khauHaoTaiSan.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'ky' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <KyTab />
        </div>
      )}
      {activeTab === 'stats' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <ThongKeTab />
          </div>
        </div>
      )}
    </div>
  );
};

export default KhauHaoTaiSanPage;
