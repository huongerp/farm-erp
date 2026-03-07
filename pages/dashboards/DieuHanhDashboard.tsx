import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { getDieuHanhGroups } from '../../lib/dieu-hanh-menu';

/** Trang submenu Điều hành (Ban Giám đốc): BSC, Chiến lược, Văn hóa, Họp, Rủi ro, Báo cáo. */
const DieuHanhDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const groups = getDieuHanhGroups(t, navigate);
  return (
    <ModuleDashboardLayout
      groups={groups}
      backTo="/"
    />
  );
};

export default DieuHanhDashboard;
