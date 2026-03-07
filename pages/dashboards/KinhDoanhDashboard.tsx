import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getKinhDoanhGroups } from '../../lib/kinh-doanh-menu';

const KinhDoanhDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getKinhDoanhGroups(t, navigate);
  return <ModuleDashboardLayout groups={groups} />;
};

export default KinhDoanhDashboard;
