import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, CreditCard } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import TrangThaiThanhToanDoiTacTab from './components/TrangThaiThanhToanDoiTacTab';

const TabTrong: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <p className="text-sm">{t('thietLapDeXuatVatTu.tabs.emptyHint')}</p>
    </div>
  );
};

const ThietLapDeXuatVatTuPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('trang-thai-thanh-toan');

  const tabs = useMemo(
    () => [
      { id: 'trong', label: t('thietLapDeXuatVatTu.tabs.trong'), icon: LayoutDashboard },
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
          {activeTab === 'trong' && <TabTrong />}
          {activeTab === 'trang-thai-thanh-toan' && <TrangThaiThanhToanDoiTacTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ThietLapDeXuatVatTuPage;
