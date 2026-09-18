import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Search } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import TongQuanTab from './components/TongQuanTab';
import TraCuuTab from './components/TraCuuTab';

const VALID_TABS = ['overview', 'lookup'] as const;
type TabId = (typeof VALID_TABS)[number];

/** Thống kê & tra cứu quỹ (Tài chính). */
const ThongKeQuyPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabFromUrl = searchParams.get('tab');
  useEffect(() => {
    if (VALID_TABS.includes(tabFromUrl as TabId)) setActiveTab(tabFromUrl as TabId);
  }, [tabFromUrl]);

  const handleTabChange = (id: string) => {
    if (!VALID_TABS.includes(id as TabId)) return;
    setActiveTab(id as TabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    });
  };

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('thongKeQuy.tabs.overview'), icon: BarChart3 },
      { id: 'lookup', label: t('thongKeQuy.tabs.lookup'), icon: Search },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {activeTab === 'overview' ? <TongQuanTab /> : <TraCuuTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ThongKeQuyPage;
