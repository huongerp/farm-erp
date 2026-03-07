import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PackagePlus, PackageMinus, ArrowLeftRight, ListChecks } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import NhapKhoTab from './components/NhapKhoTab';
import XuatKhoTab from './components/XuatKhoTab';
import ChuyenKhoTab from './components/ChuyenKhoTab';
import ChiTietPhieuKhoTab from './components/ChiTietPhieuKhoTab';

const VALID_TABS = ['nhap', 'xuat', 'chuyen', 'chiTiet'] as const;
type TabId = (typeof VALID_TABS)[number];

const PhieuKhoPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('nhap');

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
      { id: 'nhap', label: t('phieuKho.tabs.nhap'), icon: PackagePlus },
      { id: 'xuat', label: t('phieuKho.tabs.xuat'), icon: PackageMinus },
      { id: 'chuyen', label: t('phieuKho.tabs.chuyen'), icon: ArrowLeftRight },
      { id: 'chiTiet', label: t('phieuKho.tabs.chiTiet'), icon: ListChecks },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'nhap' && <NhapKhoTab />}
        {activeTab === 'xuat' && <XuatKhoTab />}
        {activeTab === 'chuyen' && <ChuyenKhoTab />}
        {activeTab === 'chiTiet' && <ChiTietPhieuKhoTab />}
      </div>
    </div>
  );
};

export default PhieuKhoPage;
