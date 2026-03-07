import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getTaiChinhGroups } from '../../lib/tai-chinh-menu';

const TaiChinhDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getTaiChinhGroups(t, navigate);
  return <ModuleDashboardLayout groups={groups} />;
};

export default TaiChinhDashboard;
