import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getKhoVanGroups } from '../../lib/kho-van-menu';
import DashboardToolbar from '../../components/shared/DashboardToolbar';

const KhoVanDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getKhoVanGroups(t, navigate);

  if (groups.length === 0) {
    return (
      <div className="space-y-4 pb-10 pt-2">
        <div className="-mx-1.5 -mt-2 md:-mx-2 md:-mt-2 mb-2">
          <DashboardToolbar onBack={() => navigate('/')} />
        </div>
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t('page.khoVan.placeholder')}
        </p>
      </div>
    );
  }

  return <ModuleDashboardLayout groups={groups} />;
};

export default KhoVanDashboard;
