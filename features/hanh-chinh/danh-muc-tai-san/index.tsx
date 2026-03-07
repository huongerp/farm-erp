import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, User, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import CuaToiTab from './components/CuaToiTab';
import ThongKeTab from './components/ThongKeTab';

const DanhSachTaiSanPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');

  const tabs = useMemo(
    () => [
      { id: 'list', label: t('danhSachTaiSan.tabs.list'), icon: List },
      { id: 'my', label: t('danhSachTaiSan.tabs.my'), icon: User },
      { id: 'stats', label: t('danhSachTaiSan.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'list' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <DanhSachTab />
        </div>
      ) : activeTab === 'my' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <CuaToiTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <ThongKeTab />
        </div>
      )}
    </div>
  );
};

export default DanhSachTaiSanPage;
