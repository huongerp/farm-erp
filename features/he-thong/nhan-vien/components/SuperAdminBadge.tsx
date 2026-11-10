import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import EnumBadge from '../../../../components/ui/EnumBadge';

/** Badge "Super admin" cạnh tên nhân viên (bảng, drawer chi tiết). */
const SuperAdminBadge: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  return (
    <EnumBadge
      value="super_admin"
      config={{ super_admin: { label: t('nhanVienSuperAdmin.badge'), color: 'violet', icon: <ShieldCheck size={12} /> } }}
      className={className}
    />
  );
};

export default SuperAdminBadge;
