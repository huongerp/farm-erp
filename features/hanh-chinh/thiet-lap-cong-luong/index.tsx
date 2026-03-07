import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, Layers, Scale } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import PayrollWifiIpTab from './components/ip-tab';
import PayrollFormGroupTab from './components/group-tab';
import PayrollPointGroupTab from './components/point-group-tab';

const PayrollSetupPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ip');

  const tabs = useMemo(
    () => [
      { id: 'ip', label: t('payrollIp.tabs.ipSettings'), icon: Wifi },
      { id: 'groups', label: t('payrollIp.tabs.adminFormGroups'), icon: Layers },
      { id: 'pointGroups', label: t('payrollIp.tabs.pointGroups'), icon: Scale },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'ip' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <PayrollWifiIpTab />
        </div>
      ) : activeTab === 'groups' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <PayrollFormGroupTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <PayrollPointGroupTab />
        </div>
      )}
    </div>
  );
};

export default PayrollSetupPage;
