import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { List, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import TatCaTab from './components/TatCaTab';
import ThongKeTab from './components/ThongKeTab';

const BaoTriSuaChuaPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const taiSanIdFromQuery = searchParams.get('tai_san_id') ?? undefined;
  const [activeTab, setActiveTab] = useState('all');

  const tabs = useMemo(
    () => [
      { id: 'all', label: t('baoTriSuaChua.tabs.all'), icon: List },
      { id: 'stats', label: t('baoTriSuaChua.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'all' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <TatCaTab defaultTaiSanId={taiSanIdFromQuery} />
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

export default BaoTriSuaChuaPage;
