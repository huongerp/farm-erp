import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, List, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import AttendanceTodayTab from './components/today-tab';
import AttendanceHistoryTab from './components/history-tab';
import AttendanceSummaryTab from './components/summary-tab';

const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('today');

  const tabs = useMemo(
    () => [
      { id: 'today', label: t('attendance.tabs.today'), icon: CalendarCheck },
      { id: 'history', label: t('attendance.tabs.history'), icon: List },
      { id: 'summary', label: t('attendance.tabs.summary'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'today' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AttendanceTodayTab />
        </div>
      )}
      {activeTab === 'history' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AttendanceHistoryTab />
        </div>
      )}
      {activeTab === 'summary' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AttendanceSummaryTab />
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
