import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TabGroup from '../../../components/ui/TabGroup';
import DashboardToolbar from '../../../components/shared/DashboardToolbar';
import EmptyState from '../../../components/shared/EmptyState';

const TABS = [
  { id: 'nhom-khach-hang', labelKey: 'page.kinhDoanh.thietLapCrm.tabNhomKhachHang' },
  { id: 'placeholder', labelKey: 'page.kinhDoanh.thietLapCrm.tabPlaceholder' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const ThietLapCrmPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('nhom-khach-hang');

  const tabItems = TABS.map((tab) => ({
    id: tab.id,
    label: t(tab.labelKey),
  }));

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <DashboardToolbar
        onBack={() => navigate('/kinh-doanh')}
        leadingContent={
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
              {t('page.kinhDoanh.modules.thietLapCrm')}
            </h1>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {t('page.kinhDoanh.descs.thietLapCrm')}
            </p>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
          <TabGroup
            tabs={tabItems}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          {activeTab === 'nhom-khach-hang' && (
            <EmptyState
              title={t('page.kinhDoanh.thietLapCrm.tabNhomKhachHang')}
              description={t('settings.comingSoonDesc')}
            />
          )}
          {activeTab === 'placeholder' && (
            <EmptyState
              title={t('page.kinhDoanh.thietLapCrm.tabPlaceholder')}
              description={t('settings.comingSoonDesc')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ThietLapCrmPage;
