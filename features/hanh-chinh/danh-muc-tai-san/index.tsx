import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, User, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import CuaToiTab from './components/CuaToiTab';
import ThongKeTab from './components/ThongKeTab';
import { useDanhSachTaiSanViewScope } from './hooks/use-danh-sach-tai-san-view-scope';

const DanhSachTaiSanPage: React.FC = () => {
  const { t } = useTranslation();
  const { viewAll } = useDanhSachTaiSanViewScope();
  const [activeTab, setActiveTab] = useState('list');

  const tabs = useMemo(() => {
    const all = [
      { id: 'list', label: t('danhSachTaiSan.tabs.list'), icon: List },
      { id: 'my', label: t('danhSachTaiSan.tabs.my'), icon: User },
      { id: 'stats', label: t('danhSachTaiSan.tabs.stats'), icon: BarChart3 },
    ];
    return viewAll ? all : [all[1], all[2]];
  }, [t, viewAll]);

  useEffect(() => {
    if (!viewAll && activeTab === 'list') setActiveTab('my');
  }, [viewAll, activeTab]);

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
