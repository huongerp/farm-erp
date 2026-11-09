import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CalendarClock, Wrench } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import type { LichBaoDuongRow } from './core/list-types';
import { useViecDangDung } from './hooks/use-bao-duong-thiet-bi';
import StatsCards from './components/StatsCards';
import LichBaoDuongTab from './components/LichBaoDuongTab';
import ThietBiTab from './components/ThietBiTab';
import GhiNhanBaoDuongDialog from './components/GhiNhanBaoDuongDialog';

const VALID_TABS = ['lich', 'thiet-bi'] as const;
type TabId = (typeof VALID_TABS)[number];

/** Trang Bảo dưỡng thiết bị — 3 thẻ số, 2 tab (lịch + thiết bị), dialog ghi nhận ở tầng trang. */
const BaoDuongThietBiPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    VALID_TABS.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : 'lich'
  );
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== prevTabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (VALID_TABS.includes(tabFromUrl as TabId)) setActiveTab(tabFromUrl as TabId);
  }

  const viecQuery = useViecDangDung();
  const [ghiNhanRow, setGhiNhanRow] = useState<LichBaoDuongRow | null>(null);

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
      { id: 'lich', label: t('baoDuongThietBi.tabs.lich'), icon: CalendarClock },
      { id: 'thiet-bi', label: t('baoDuongThietBi.tabs.thietBi'), icon: Wrench },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
      <StatsCards viec={viecQuery.data ?? []} className="shrink-0" />
      <div className="shrink-0 relative z-0 mt-2.5">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'lich' && <LichBaoDuongTab onGhiNhan={setGhiNhanRow} />}
        {activeTab === 'thiet-bi' && <ThietBiTab onGhiNhan={setGhiNhanRow} />}
      </div>

      <AnimatePresence>
        {ghiNhanRow && <GhiNhanBaoDuongDialog row={ghiNhanRow} onClose={() => setGhiNhanRow(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default BaoDuongThietBiPage;
