import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radar, ClipboardList } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import RealtimeTab from './components/realtime-tab';
import EmployeeAttendanceTab from './components/employee-tab';

const AttendanceManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('realtime');

  const tabs = useMemo(
    () => [
      { id: 'realtime', label: t('attendance.management.tabs.realtime'), icon: Radar },
      { id: 'employees', label: t('attendance.management.tabs.bangCong'), icon: ClipboardList },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'realtime' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <RealtimeTab />
        </div>
      )}
      {activeTab === 'employees' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <EmployeeAttendanceTab />
        </div>
      )}
    </div>
  );
};

export default AttendanceManagementPage;
