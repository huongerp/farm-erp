import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, Edit } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { AttendanceLog } from '../core/types';

interface Props {
  data: AttendanceLog;
  onClose: () => void;
  onEdit: (item: AttendanceLog) => void;
}

const AttendanceLogDetail: React.FC<Props> = ({ data, onClose, onEdit }) => {
  const { t } = useTranslation();

  const renderStatus = () => {
    if (!data.check_in) {
      return <span className="text-sm text-muted-foreground">{t('attendance.history.statusMissing')}</span>;
    }
    if (data.is_late) {
      return <span className="text-sm text-amber-600 font-medium">{t('attendance.history.statusLate')}</span>;
    }
    return <span className="text-sm text-emerald-600 font-medium">{t('attendance.history.statusOnTime')}</span>;
  };

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('common.edit'),
      icon: <Edit size={16} />,
      onClick: () => onEdit(data),
      variant: 'primary',
    },
  ];

  return (
    <GenericDrawer
      title={t('attendance.detail.logTitle')}
      subtitle={`${data.user_name} · ${data.date}`}
      icon={<Calendar size={20} />}
      onClose={onClose}
      footer={<DetailToolbar actions={toolbarActions} />}
    >
      <div className="space-y-4">
        <DetailSection title={t('attendance.detail.info')} icon={<User size={18} />}>
          <DetailField label={t('attendance.history.dateCol')} value={data.date} />
          <DetailField label={t('attendance.management.employeeCol')} value={data.user_name} />
          <DetailField label={t('attendance.management.departmentCol')} value={data.department_name ?? '--'} />
          <DetailField label={t('attendance.history.branchCol')} value={data.branch_name ?? '--'} />
        </DetailSection>

        <DetailSection title={t('attendance.detail.timeSection')} icon={<Clock size={18} />}>
          <DetailField label={t('attendance.history.checkInCol')} value={data.check_in ?? '--'} />
          <DetailField label={t('attendance.history.checkOutCol')} value={data.check_out ?? '--'} />
          <DetailField label={t('attendance.history.statusCol')} value={renderStatus()} />
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default AttendanceLogDetail;
