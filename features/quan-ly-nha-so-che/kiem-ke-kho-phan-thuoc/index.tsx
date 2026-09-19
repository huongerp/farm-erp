/**
 * Kiểm kê kho phân thuốc — đợt kiểm kê + thống kê.
 * Bảng: fp_farm_dot_kiem_ke_pt, _kho, _chi_tiet; tồn sổ từ v_farm_ton_kho_phan_thuoc.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import ThongKeTab from './components/ThongKeTab';

const KiemKeKhoPTPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dots');

  const tabs = useMemo(
    () => [
      { id: 'dots', label: t('kiemKeKhoPT.tabs.dots'), icon: ClipboardCheck },
      { id: 'stats', label: t('kiemKeKhoPT.tabs.stats'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="print:hidden" />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'dots' && <DanhSachTab />}
        {activeTab === 'stats' && <ThongKeTab />}
      </div>
    </div>
  );
};

export default KiemKeKhoPTPage;
