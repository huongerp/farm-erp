import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Package, BarChart3, Clock } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import TonKhoTheoSanPhamTab from './components/TonKhoTheoSanPhamTab';
import TonKhoTonThoiDiemTab from './components/TonKhoTonThoiDiemTab';
import TonKhoThongKeTab from './components/TonKhoThongKeTab';

const VALID_TABS = ['byProduct', 'tonThoiDiem', 'stats'] as const;
type TabId = (typeof VALID_TABS)[number];

const TonKhoPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('byProduct');

  const tabFromUrl = searchParams.get('tab');
  useEffect(() => {
    if (VALID_TABS.includes(tabFromUrl as TabId)) setActiveTab(tabFromUrl as TabId);
  }, [tabFromUrl]);

  const handleTabChange = (id: string) => {
    if (VALID_TABS.includes(id as TabId)) {
      setActiveTab(id as TabId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', id);
        return next;
      });
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'byProduct', label: t('tonKho.tabs.byProduct'), icon: Package },
      { id: 'tonThoiDiem', label: t('tonKho.tabs.tonThoiDiem'), icon: Clock },
      { id: 'stats', label: t('tonKho.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'byProduct' && <TonKhoTheoSanPhamTab />}
        {activeTab === 'tonThoiDiem' && <TonKhoTonThoiDiemTab />}
        {activeTab === 'stats' && <TonKhoThongKeTab />}
      </div>
    </div>
  );
};

export default TonKhoPage;
