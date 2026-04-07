import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getQuanLyFarmGroups } from '../../lib/quan-ly-farm-menu';
import { useModulesWithViewPermission, getPermissionModuleIdFromPath } from '../../features/he-thong/phan-quyen/hooks/use-module-permission';

const QuanLyFarmDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const viewableIds = useModulesWithViewPermission('/quan-ly-farm');
  const groups = useMemo(() => {
    const raw = getQuanLyFarmGroups(t, navigate);
    return raw
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const permId = item.moduleId ? getPermissionModuleIdFromPath(item.moduleId) : '';
          return !permId || viewableIds.has(permId);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [t, navigate, viewableIds]);
  return <ModuleDashboardLayout groups={groups} />;
};

export default QuanLyFarmDashboard;
