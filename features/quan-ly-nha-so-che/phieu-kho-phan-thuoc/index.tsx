import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, ListChecks } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import ChiTietTab from './components/ChiTietTab';

const VALID_TABS = ['danhSach', 'chiTiet'] as const;
type TabId = (typeof VALID_TABS)[number];

const PhieuKhoPhanThuocPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('danhSach');

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
      { id: 'danhSach', label: t('phieuKhoPhanThuoc.tabs.danhSach'), icon: ClipboardList },
      { id: 'chiTiet', label: t('phieuKhoPhanThuoc.tabs.chiTiet'), icon: ListChecks },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'danhSach' && <DanhSachTab />}
        {activeTab === 'chiTiet' && <ChiTietTab />}
      </div>
    </div>
  );
};

export default PhieuKhoPhanThuocPage;
