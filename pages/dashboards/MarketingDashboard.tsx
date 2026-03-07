import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getMarketingGroups } from '../../lib/marketing-menu';

const MarketingDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getMarketingGroups(t, navigate);
  return <ModuleDashboardLayout groups={groups} />;
};

export default MarketingDashboard;
