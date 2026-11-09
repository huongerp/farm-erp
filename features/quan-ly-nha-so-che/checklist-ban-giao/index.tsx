import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, List, Undo2 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab, { type ChecklistBanGiaoTabId } from './components/DanhSachTab';

const VALID_TABS = ['danh-sach', 'cho-toi-kiem-tra', 'bi-tra-lai'] as const;

const ChecklistBanGiaoPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ChecklistBanGiaoTabId>(() =>
    VALID_TABS.includes(tabFromUrl as ChecklistBanGiaoTabId) ? (tabFromUrl as ChecklistBanGiaoTabId) : 'danh-sach'
  );
  // Tab trên URL đổi (back/forward, link) → đồng bộ tab đang mở.
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== prevTabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (VALID_TABS.includes(tabFromUrl as ChecklistBanGiaoTabId)) setActiveTab(tabFromUrl as ChecklistBanGiaoTabId);
  }

  const handleTabChange = (id: string) => {
    if (!VALID_TABS.includes(id as ChecklistBanGiaoTabId)) return;
    setActiveTab(id as ChecklistBanGiaoTabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    });
  };

  const tabs = useMemo(
    () => [
      { id: 'danh-sach', label: t('checklistBanGiao.tabs.danhSach'), icon: List },
      { id: 'cho-toi-kiem-tra', label: t('checklistBanGiao.tabs.choToiKiemTra'), icon: ClipboardList },
      { id: 'bi-tra-lai', label: t('checklistBanGiao.tabs.biTraLai'), icon: Undo2 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        <DanhSachTab key={activeTab} tabId={activeTab} />
      </div>
    </div>
  );
};

export default ChecklistBanGiaoPage;
