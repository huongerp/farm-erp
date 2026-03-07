import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { History, User, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import LichSuTab from './components/LichSuTab';
import CuaToiTab from './components/CuaToiTab';
import ThongKeTab from './components/ThongKeTab';

const CapPhatThuHoiPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const taiSanIdFromQuery = searchParams.get('tai_san_id') ?? undefined;
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    if (taiSanIdFromQuery) setActiveTab('history');
  }, [taiSanIdFromQuery]);

  const tabs = useMemo(
    () => [
      { id: 'history', label: t('capPhatThuHoi.tabs.history'), icon: History },
      { id: 'mine', label: t('capPhatThuHoi.tabs.mine'), icon: User },
      { id: 'stats', label: t('capPhatThuHoi.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'history' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <LichSuTab defaultTaiSanId={taiSanIdFromQuery} />
        </div>
      )}
      {activeTab === 'mine' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <CuaToiTab />
        </div>
      )}
      {activeTab === 'stats' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <ThongKeTab />
        </div>
      )}
    </div>
  );
};

export default CapPhatThuHoiPage;
