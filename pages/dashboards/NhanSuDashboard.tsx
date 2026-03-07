import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getNhanSuGroups } from '../../lib/nhan-su-menu';

const NhanSuDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getNhanSuGroups(t, navigate);
  return <ModuleDashboardLayout groups={groups} />;
};

export default NhanSuDashboard;
