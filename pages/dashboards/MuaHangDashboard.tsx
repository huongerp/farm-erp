import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getMuaHangGroups } from '../../lib/mua-hang-menu';

const MuaHangDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getMuaHangGroups(t, navigate);
  return <ModuleDashboardLayout groups={groups} />;
};

export default MuaHangDashboard;
