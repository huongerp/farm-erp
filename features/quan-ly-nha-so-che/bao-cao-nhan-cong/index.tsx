import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { List, CalendarDays } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import TongHopNgayTab from './components/TongHopNgayTab';

const VALID_TABS = ['list', 'tong-hop'] as const;
type TabId = (typeof VALID_TABS)[number];

const BaoCaoNhanCongPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    VALID_TABS.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : 'list'
  );
  // Tab trên URL đổi (back/forward, link) → đồng bộ tab đang mở, điều chỉnh ngay lúc render.
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== prevTabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (VALID_TABS.includes(tabFromUrl as TabId)) setActiveTab(tabFromUrl as TabId);
  }

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
      { id: 'list', label: t('baoCaoNhanCong.tabs.list'), icon: List },
      { id: 'tong-hop', label: t('baoCaoNhanCong.tabs.tongHop'), icon: CalendarDays },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'list' && <DanhSachTab />}
        {activeTab === 'tong-hop' && <TongHopNgayTab />}
      </div>
    </div>
  );
};

export default BaoCaoNhanCongPage;
