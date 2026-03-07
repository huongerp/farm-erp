import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Clock, User, Building2, ShieldCheck, XCircle, CheckCircle2, Ban } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { formatDateTimeShort } from '../../../../lib/utils';
import { AdminFormRequest } from '../core/types';
import { getAdminFormShiftLabel, getAdminFormStatusLabel, getApprovalStatusLabel } from '../core/constants';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { BTN_CLOSE, BTN_EDIT } from '../../../../lib/button-labels';
import { useAuthStore } from '../../../../store/useStore';

interface Props {
  data: AdminFormRequest;
  onClose: () => void;
  onEdit?: (item: AdminFormRequest) => void;
  onCancel?: (id: string) => void;
  onApproveManager?: (id: string) => void;
  onRejectManager?: (id: string) => void;
  onApproveHcns?: (id: string) => void;
  onRejectHcns?: (id: string) => void;
}

const AdminFormDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onCancel,
  onApproveManager,
  onRejectManager,
  onApproveHcns,
  onRejectHcns,
}) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const canCancel = ['pending', 'manager_approved'].includes(data.trang_thai);
  const isManager = !!user?.id && user.id === data.quan_ly_id;
  const isHcns = !!user?.id && user.id === data.hcns_id;
  const canManagerApprove =
    data.trang_thai_quan_ly === 'pending' &&
    !['cancelled', 'rejected'].includes(data.trang_thai) &&
    (isAdmin || isManager);
  const canHcnsApprove =
    data.trang_thai_quan_ly === 'approved' &&
    data.trang_thai_hcns === 'pending' &&
    !['cancelled', 'rejected'].includes(data.trang_thai) &&
    (isAdmin || isHcns);

  const toolbarActions = useMemo<DetailToolbarAction[]>(() => {
    const actions: DetailToolbarAction[] = [];
    if (onApproveManager && canManagerApprove) {
      actions.push({
        label: t('adminForm.actions.approveManager'),
        icon: <CheckCircle2 size={16} />,
        onClick: () => onApproveManager(data.id),
        variant: 'success',
      });
    }
    if (onRejectManager && canManagerApprove) {
      actions.push({
        label: t('adminForm.actions.rejectManager'),
        icon: <XCircle size={16} />,
        onClick: () => onRejectManager(data.id),
        variant: 'danger',
      });
    }
    if (onApproveHcns && canHcnsApprove) {
      actions.push({
        label: t('adminForm.actions.approveHr'),
        icon: <ShieldCheck size={16} />,
        onClick: () => onApproveHcns(data.id),
        variant: 'success',
      });
    }
    if (onRejectHcns && canHcnsApprove) {
      actions.push({
        label: t('adminForm.actions.rejectHr'),
        icon: <Ban size={16} />,
        onClick: () => onRejectHcns(data.id),
        variant: 'danger',
      });
    }
    if (onCancel && canCancel) {
      actions.push({
        label: t('adminForm.actions.cancel'),
        icon: <XCircle size={16} />,
        onClick: () => onCancel(data.id),
        variant: 'warning',
      });
    }
    return actions;
  }, [canCancel, canManagerApprove, canHcnsApprove, data.id, onApproveManager, onRejectManager, onApproveHcns, onRejectHcns, onCancel, t]);

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      {onEdit && (
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <FileText size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
      )}
    </div>
  );

  return (
    <GenericDrawer
      title={t('adminForm.detail.title')}
      subtitle={getAdminFormTypeLabel(data.loai_phieu, t)}
      icon={<FileText size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection title={t('adminForm.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('adminForm.form.type')} value={getAdminFormTypeLabel(data.loai_phieu, t)} icon={<FileText size={12} />} />
            <DetailField label={t('adminForm.form.shift')} value={getAdminFormShiftLabel(data.ca, t)} icon={<Clock size={12} />} />
            <DetailField label={t('adminForm.form.date')} value={data.ngay} icon={<Calendar size={12} />} />
            <DetailField label={t('adminForm.form.reason')} value={data.ly_do} icon={<FileText size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('adminForm.detail.requesterInfo')} icon={<User size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('adminForm.store.requesterCol')} value={data.ten_nguoi_tao} icon={<User size={12} />} />
            <DetailField label={t('adminForm.store.departmentCol')} value={data.ten_phong_ban || '—'} icon={<Building2 size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('adminForm.detail.approvalInfo')} icon={<ShieldCheck size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('adminForm.detail.managerApproval')} value={getApprovalStatusLabel(data.trang_thai_quan_ly, t)} icon={<ShieldCheck size={12} />} />
            <DetailField label={t('adminForm.detail.hrApproval')} value={getApprovalStatusLabel(data.trang_thai_hcns, t)} icon={<ShieldCheck size={12} />} />
            <DetailField label={t('adminForm.detail.overallStatus')} value={getAdminFormStatusLabel(data.trang_thai, t)} icon={<ShieldCheck size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('adminForm.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('adminForm.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('adminForm.detail.updatedAt')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default AdminFormDetail;
