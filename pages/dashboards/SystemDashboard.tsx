import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Building, Shield, ListOrdered, Briefcase, MapPin } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { useModulesWithViewPermission } from '../../features/he-thong/phan-quyen/hooks/use-module-permission';

const SystemDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const viewableIds = useModulesWithViewPermission('/he-thong');

  const allGroups = useMemo(
    () => [
      {
        groupTitle: t('page.systemDashboard.orgChartGroup'),
        items: [
          { title: t('page.systemDashboard.department'), description: t('page.systemDashboard.departmentDesc'), icon: Building, color: 'bg-indigo-500', action: () => navigate('/phong-ban'), moduleId: 'he-thong/phong-ban' },
          { title: t('page.systemDashboard.jobLevel'), description: t('page.systemDashboard.jobLevelDesc'), icon: ListOrdered, color: 'bg-orange-500', action: () => navigate('/cap-bac'), moduleId: 'he-thong/cap-bac' },
          { title: t('page.systemDashboard.position'), description: t('page.systemDashboard.positionDesc'), icon: Briefcase, color: 'bg-blue-500', action: () => navigate('/chuc-vu'), moduleId: 'he-thong/chuc-vu' },
          { title: t('page.systemDashboard.employee'), description: t('page.systemDashboard.employeeDesc'), icon: Users, color: 'bg-emerald-500', action: () => navigate('/nhan-vien'), moduleId: 'he-thong/nhan-vien' },
        ],
      },
      {
        groupTitle: t('page.systemDashboard.securityGroup'),
        items: [
          { title: t('page.systemDashboard.companyInfo'), description: t('page.systemDashboard.companyInfoDesc'), icon: Building, color: 'bg-violet-500', action: () => navigate('/thong-tin-cong-ty'), moduleId: 'he-thong/thong-tin-cong-ty' },
          { title: t('page.systemDashboard.branch'), description: t('page.systemDashboard.branchDesc'), icon: MapPin, color: 'bg-fuchsia-500', action: () => navigate('/chi-nhanh'), moduleId: 'he-thong/chi-nhanh' },
          { title: t('page.systemDashboard.permission'), description: t('page.systemDashboard.permissionDesc'), icon: Shield, color: 'bg-rose-500', action: () => navigate('/phan-quyen'), moduleId: 'he-thong/phan-quyen' },
        ],
      },
    ],
    [t, navigate]
  );

  const groups = useMemo(
    () =>
      allGroups
        .map((g) => ({
          ...g,
          items: g.items.filter((item) => item.moduleId && viewableIds.has(item.moduleId)),
        }))
        .filter((g) => g.items.length > 0),
    [allGroups, viewableIds]
  );

  return <ModuleDashboardLayout groups={groups} />;
};

export default SystemDashboard;
