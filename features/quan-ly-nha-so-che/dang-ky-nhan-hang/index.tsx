import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, List } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import ThongKeTab from './components/ThongKeTab';

const VALID_TABS = ['phieu', 'thong-ke'] as const;
type TabId = (typeof VALID_TABS)[number];

const DangKyNhanHangPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    VALID_TABS.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : 'phieu'
  );
  // Tab trên URL đổi (back/forward, link) → đồng bộ tab đang mở, điều chỉnh ngay lúc render.
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== prevTabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (VALID_TABS.includes(tabFromUrl as TabId)) setActiveTab(tabFromUrl as TabId);
  }

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
      { id: 'phieu', label: t('dangKyNhanHang.tabs.phieu'), icon: List },
      { id: 'thong-ke', label: t('dangKyNhanHang.tabs.thongKe'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'phieu' && <DanhSachTab />}
        {activeTab === 'thong-ke' && (
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <ThongKeTab />
          </div>
        )}
      </div>
    </div>
  );
};

export default DangKyNhanHangPage;
