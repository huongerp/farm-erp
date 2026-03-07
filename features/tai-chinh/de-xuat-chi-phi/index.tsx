import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { List, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import ThongKeTab from './components/ThongKeTab';

const VALID_TABS = ['list', 'stats'] as const;
type TabId = (typeof VALID_TABS)[number];

const DeXuatChiPhiPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('list');

  const tabFromUrl = searchParams.get('tab');
  useEffect(() => {
    if (tabFromUrl === 'list' || tabFromUrl === 'stats') setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (id: string) => {
    if (id === 'list' || id === 'stats') {
      setActiveTab(id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', id);
        return next;
      });
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'list', label: t('deXuatChiPhi.tabs.list'), icon: List },
      { id: 'stats', label: t('deXuatChiPhi.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'list' && <DanhSachTab />}
        {activeTab === 'stats' && <ThongKeTab />}
      </div>
    </div>
  );
};

export default DeXuatChiPhiPage;
