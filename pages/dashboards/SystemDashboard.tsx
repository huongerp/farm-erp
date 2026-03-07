
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Building, Shield, ArrowUpDown, ListOrdered, Briefcase, Monitor, MapPin, ClipboardList } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';

const SystemDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const groups = [
    {
      groupTitle: t('page.systemDashboard.orgChartGroup'),
      items: [
        { title: t('page.systemDashboard.department'), description: t('page.systemDashboard.departmentDesc'), icon: Building, color: "bg-indigo-500", action: () => navigate('/phong-ban') },
        { title: t('page.systemDashboard.jobLevel'), description: t('page.systemDashboard.jobLevelDesc'), icon: ListOrdered, color: "bg-orange-500", action: () => navigate('/cap-bac') },
        { title: t('page.systemDashboard.position'), description: t('page.systemDashboard.positionDesc'), icon: Briefcase, color: "bg-blue-500", action: () => navigate('/chuc-vu') },
        { title: t('page.systemDashboard.functionsTasks'), description: t('page.systemDashboard.functionsTasksDesc'), icon: ClipboardList, color: "bg-sky-500", action: () => navigate('/chuc-nang-nhiem-vu') },
        { title: t('page.systemDashboard.employee'), description: t('page.systemDashboard.employeeDesc'), icon: Users, color: "bg-emerald-500", action: () => navigate('/nhan-vien') },
      ]
    },
    {
      groupTitle: t('page.systemDashboard.securityGroup'),
      items: [
        { title: t('page.systemDashboard.companyInfo'), description: t('page.systemDashboard.companyInfoDesc'), icon: Building, color: "bg-violet-500", action: () => navigate('/thong-tin-cong-ty') },
        { title: t('page.systemDashboard.branch'), description: t('page.systemDashboard.branchDesc'), icon: MapPin, color: "bg-fuchsia-500", action: () => navigate('/chi-nhanh') },
        { title: t('page.systemDashboard.permission'), description: t('page.systemDashboard.permissionDesc'), icon: Shield, color: "bg-rose-500", action: () => navigate('/phan-quyen') },
        { title: t('page.systemDashboard.backup'), description: t('page.systemDashboard.backupDesc'), icon: ArrowUpDown, color: "bg-cyan-500", action: () => navigate('/sao-luu') },
        { title: t('page.systemDashboard.loginDevices'), description: t('page.systemDashboard.loginDevicesDesc'), icon: Monitor, color: "bg-teal-500", action: () => navigate('/thiet-bi-dang-nhap') },
      ]
    }
  ];

  return <ModuleDashboardLayout groups={groups} />;
};

export default SystemDashboard;
