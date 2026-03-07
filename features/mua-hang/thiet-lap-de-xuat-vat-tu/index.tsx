import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, CreditCard } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import TrangThaiDoiTacTab from './components/TrangThaiDoiTacTab';
import TrangThaiThanhToanDoiTacTab from './components/TrangThaiThanhToanDoiTacTab';

const ThietLapDeXuatVatTuPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('trang-thai-doi-tac');

  const tabs = useMemo(
    () => [
      { id: 'trang-thai-doi-tac', label: t('thietLapDeXuatVatTu.tabs.trangThaiDoiTac'), icon: Users },
      { id: 'trang-thai-thanh-toan', label: t('thietLapDeXuatVatTu.tabs.trangThaiThanhToan'), icon: CreditCard },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          {activeTab === 'trang-thai-doi-tac' && <TrangThaiDoiTacTab />}
          {activeTab === 'trang-thai-thanh-toan' && <TrangThaiThanhToanDoiTacTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ThietLapDeXuatVatTuPage;
