import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FileText, ListOrdered } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import PayrollFormGroupTab from './components/group-tab';
import PayrollPointGroupTab from './components/point-group-tab';

const TAB_ADMIN_GROUPS = 'adminFormGroups';
const TAB_POINT_GROUPS = 'pointGroupsSetup';

const PayrollSetupPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(TAB_ADMIN_GROUPS);

  const tabFromUrl = searchParams.get('tab');
  useEffect(() => {
    if (tabFromUrl === TAB_ADMIN_GROUPS || tabFromUrl === TAB_POINT_GROUPS) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const tabs = useMemo(
    () => [
      { id: TAB_ADMIN_GROUPS, label: t('payrollIp.tabs.adminFormGroups'), icon: FileText },
      { id: TAB_POINT_GROUPS, label: t('payrollIp.tabs.pointGroupsSetup'), icon: ListOrdered },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === TAB_ADMIN_GROUPS && <PayrollFormGroupTab />}
        {activeTab === TAB_POINT_GROUPS && <PayrollPointGroupTab />}
      </div>
    </div>
  );
};

export default PayrollSetupPage;
