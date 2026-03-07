import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Users, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import AdminFormMyTab from './components/my-tab';
import AdminFormManagedTab from './components/managed-tab';
import AdminFormQuotaTab from './components/quota-tab';

const AdminFormPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('my');

  const tabs = useMemo(
    () => [
      { id: 'my', label: t('adminForm.tabs.my'), icon: ClipboardList },
      { id: 'managed', label: t('adminForm.tabs.managed'), icon: Users },
      { id: 'quota', label: t('adminForm.tabs.quota'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'my' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AdminFormMyTab />
        </div>
      ) : activeTab === 'managed' ? (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AdminFormManagedTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <AdminFormQuotaTab />
        </div>
      )}
    </div>
  );
};

export default AdminFormPage;
