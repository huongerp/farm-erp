import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getHanhChinhGroups } from '../../lib/hanh-chinh-menu';

const HanhChinhDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getHanhChinhGroups(t, navigate);
  return <ModuleDashboardLayout groups={groups} />;
};

export default HanhChinhDashboard;
