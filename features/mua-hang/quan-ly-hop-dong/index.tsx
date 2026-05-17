import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FileText, Wallet, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import ThanhToanTab from './components/ThanhToanTab';
import BaoCaoTab from './components/BaoCaoTab';

const VALID_TABS = ['hopDong', 'thanhToan', 'baoCao'] as const;
type TabId = (typeof VALID_TABS)[number];

const QuanLyHopDongPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('hopDong');

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
      { id: 'hopDong', label: t('hopDong.tabs.hopDong'), icon: FileText },
      { id: 'thanhToan', label: t('hopDong.tabs.thanhToan'), icon: Wallet },
      { id: 'baoCao', label: t('hopDong.tabs.baoCao'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0 px-1">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'hopDong' && <DanhSachTab />}
        {activeTab === 'thanhToan' && <ThanhToanTab />}
        {activeTab === 'baoCao' && <BaoCaoTab />}
      </div>
    </div>
  );
};

export default QuanLyHopDongPage;
