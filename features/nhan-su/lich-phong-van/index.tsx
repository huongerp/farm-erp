import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Calendar, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import DanhSachTab from './components/DanhSachTab';
import CalendarTab from './components/CalendarTab';
import ThongKeTab from './components/ThongKeTab';
import LichPhongVanDetail from './components/LichPhongVanDetail';
import LichPhongVanDanhGiaForm from './components/LichPhongVanDanhGiaForm';
import { AnimatePresence } from 'framer-motion';
import type { LichPhongVan } from './core/types';

const LichPhongVanPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('lich');
  const [calendarDetailItem, setCalendarDetailItem] = useState<LichPhongVan | null>(null);
  const [danhGiaItem, setDanhGiaItem] = useState<LichPhongVan | null>(null);

  const tabs = useMemo(
    () => [
      { id: 'lich', label: t('lichPhongVan.tabs.lich'), icon: List },
      { id: 'calendar', label: t('lichPhongVan.tabs.calendar'), icon: Calendar },
      { id: 'thongke', label: t('lichPhongVan.tabs.thongKe'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'lich' ? (
          <div className="flex-1 min-h-0 flex flex-col mt-1.5">
            <DanhSachTab />
          </div>
        ) : activeTab === 'calendar' ? (
          <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <CalendarTab onViewDetail={setCalendarDetailItem} />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <ThongKeTab />
          </div>
        )}

        <AnimatePresence>
          {calendarDetailItem && (
            <LichPhongVanDetail
              data={calendarDetailItem}
              onClose={() => setCalendarDetailItem(null)}
              onEdit={() => setCalendarDetailItem(null)}
              onOpenDanhGia={(item) => setDanhGiaItem(item)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {danhGiaItem && (
            <LichPhongVanDanhGiaForm
              initialData={danhGiaItem}
              onClose={() => setDanhGiaItem(null)}
              onSuccess={(updated) => {
                if (calendarDetailItem?.id === updated.id) setCalendarDetailItem(updated);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default LichPhongVanPage;
