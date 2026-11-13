import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Building2, CalendarClock, Wrench } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import Select from '../../../components/ui/Select';
import type { LichBaoDuongRow } from './core/list-types';
import { useBaoDuongTheoFarm } from './hooks/use-bao-duong-thiet-bi';
import { useBaoDuongFarm } from './hooks/use-bao-duong-view-scope';
import StatsCards from './components/StatsCards';
import LichBaoDuongTab from './components/LichBaoDuongTab';
import ThietBiTab from './components/ThietBiTab';
import GhiNhanBaoDuongDialog from './components/GhiNhanBaoDuongDialog';

const VALID_TABS = ['lich', 'thiet-bi'] as const;
type TabId = (typeof VALID_TABS)[number];

/** Trang Bảo dưỡng thiết bị — ô chọn farm, 3 thẻ số, 2 tab (lịch + thiết bị), dialog ghi nhận ở tầng trang. */
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

  const farm = useBaoDuongFarm();
  const { viec } = useBaoDuongTheoFarm(farm.farmId);
  const farmOptions = useMemo(
    () => farm.farms.map((b) => ({ value: b.id, label: b.ten_chi_nhanh })),
    [farm.farms]
  );
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
      {/* Mỗi farm một danh sách thiết bị riêng (cùng loại máy, khác mã tài sản). */}
      <div className="shrink-0 mb-2 flex items-center gap-2">
        <div className="w-full sm:w-72">
          <Select
            aria-label={t('baoDuongThietBi.farm.label')}
            icon={<Building2 size={14} />}
            value={farm.farmId ?? ''}
            onChange={(e) => farm.setFarmId(e.target.value || null)}
            options={farmOptions}
            placeholder={
              farm.farmId ? undefined : farm.isLoading ? t('baoDuongThietBi.loading') : t('baoDuongThietBi.farm.chuaPhan')
            }
            disabled={farmOptions.length === 0}
          />
        </div>
      </div>
      <StatsCards viec={viec} className="shrink-0" />
      <div className="shrink-0 relative z-0 mt-2.5">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {/* key theo farm: đổi farm thì dựng lại tab → bỏ lọc khu vực / trang của farm cũ */}
        {activeTab === 'lich' && <LichBaoDuongTab key={farm.farmId ?? ''} farmId={farm.farmId} onGhiNhan={setGhiNhanRow} />}
        {activeTab === 'thiet-bi' && <ThietBiTab key={farm.farmId ?? ''} farmId={farm.farmId} onGhiNhan={setGhiNhanRow} />}
      </div>

      <AnimatePresence>
        {ghiNhanRow && <GhiNhanBaoDuongDialog row={ghiNhanRow} onClose={() => setGhiNhanRow(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default BaoDuongThietBiPage;
