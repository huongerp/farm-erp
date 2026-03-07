import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Users, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import CuaToiTab from './components/CuaToiTab';
import ToiQuanLyTab from './components/ToiQuanLyTab';
import ThongKeTab from './components/ThongKeTab';

const ChamDiemKpiPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('my');

  const tabs = useMemo(
    () => [
      { id: 'my', label: t('chamDiemKpi.tabs.my'), icon: User },
      { id: 'managed', label: t('chamDiemKpi.tabs.managed'), icon: Users },
      { id: 'stats', label: t('chamDiemKpi.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'my' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <CuaToiTab />
        </div>
      ) : activeTab === 'managed' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <ToiQuanLyTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <ThongKeTab />
        </div>
      )}
    </div>
  );
};

export default ChamDiemKpiPage;
