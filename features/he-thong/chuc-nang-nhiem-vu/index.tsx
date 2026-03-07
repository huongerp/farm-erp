import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Target } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import FunctionsTasksTab from './components/FunctionsTasksTab';
import KpiIndicatorsTab from './components/KpiIndicatorsTab';

const ChucNangNhiemVuPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('functions');

  const tabs = useMemo(
    () => [
      { id: 'functions', label: t('chucNangNhiemVu.tab.functionsTasks'), icon: ClipboardList },
      { id: 'kpi', label: t('chucNangNhiemVu.tab.kpi'), icon: Target },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5 overflow-auto">
        {activeTab === 'functions' ? (
          <FunctionsTasksTab />
        ) : (
          <KpiIndicatorsTab />
        )}
      </div>
    </div>
  );
};

export default ChucNangNhiemVuPage;
