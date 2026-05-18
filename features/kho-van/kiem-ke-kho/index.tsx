/**
 * Kiểm kê kho – đợt kiểm kê + thống kê (fp_mh_dot_kiem_ke_kho, fp_mh_dot_kiem_ke_kho_chi_tiet).
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DotTab from './components/DotTab';
import ThongKeTab from './components/ThongKeTab';

const KiemKeKhoPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dots');

  const tabs = useMemo(
    () => [
      { id: 'dots', label: t('kiemKeKho.tabs.dots'), icon: ClipboardCheck },
      { id: 'stats', label: t('kiemKeKho.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 px-4">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="shrink-0 mb-2 print:hidden" />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === 'dots' && <DotTab />}
          {activeTab === 'stats' && <ThongKeTab />}
        </div>
      </div>
    </div>
  );
};

export default KiemKeKhoPage;
