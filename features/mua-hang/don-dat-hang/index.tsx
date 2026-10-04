import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { List, LayoutList, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import ChiTietDonDatHangTab from './components/ChiTietDonDatHangTab';
import ThongKeTab from './components/ThongKeTab';

const VALID_TABS = ['list', 'chiTiet', 'stats'] as const;
type TabId = (typeof VALID_TABS)[number];

const DonDatHangPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  // Tab lấy từ URL ngay lần render đầu; URL đổi (back/forward, link) thì điều chỉnh lúc render
  // thay vì setState trong effect.
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    VALID_TABS.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : 'list'
  );
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (prevTabFromUrl !== tabFromUrl) {
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
      { id: 'list', label: t('donDatHang.tabs.list'), icon: List },
      { id: 'chiTiet', label: t('donDatHang.tabs.chiTiet'), icon: LayoutList },
      { id: 'stats', label: t('donDatHang.tabs.stats'), icon: BarChart3 },
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
        {activeTab === 'chiTiet' && <ChiTietDonDatHangTab />}
        {activeTab === 'stats' && (
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <ThongKeTab />
          </div>
        )}
      </div>
    </div>
  );
};

export default DonDatHangPage;
