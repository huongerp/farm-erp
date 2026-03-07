import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import ThongKeTab from './components/ThongKeTab';

const DeXuatTuyenDungPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('danhsach');

  const tabs = useMemo(
    () => [
      { id: 'danhsach', label: t('deXuatTuyenDung.tabs.danhSach'), icon: List },
      { id: 'thongke', label: t('deXuatTuyenDung.tabs.thongKe'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <DanhSachTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <ThongKeTab />
        </div>
      )}
    </div>
  );
};

export default DeXuatTuyenDungPage;
