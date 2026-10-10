/**
 * Trang in hồ sơ nhân viên. Route: /ho-so-nhan-vien/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useEmployee } from './hooks/use-nhan-vien';
import { exportEmployeeProfileExcel } from './utils/export-employee-profile';
import EmployeeProfilePreviewContent from './components/EmployeeProfilePreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const EmployeeProfilePreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading, isError, error, refetch } = useEmployee(id ?? null);

  const loi = isError
    ? (error?.message ?? t('employee.profile.loadError'))
    : !isLoading && !employee
      ? t('employee.profile.notFound')
      : null;

  return (
    <PhieuInPage
      title={employee ? `${t('employee.pdf.title')} - ${employee.ho_ten} (${employee.ma_nhan_vien})` : t('employee.pdf.title')}
      mauKey="ho-so-nhan-vien"
      macDinh={MAC_DINH}
      tenFile={employee ? `Ho_so_${employee.ma_nhan_vien}` : 'ho-so-nhan-vien'}
      duongDanVe="/nhan-vien"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        employee
          ? [{ key: 'xlsx', label: 'Excel', icon: <FileSpreadsheet size={16} />, onClick: () => exportEmployeeProfileExcel(employee) }]
          : undefined
      }
    >
      {employee && <EmployeeProfilePreviewContent employee={employee} />}
    </PhieuInPage>
  );
};

export default EmployeeProfilePreviewPage;
