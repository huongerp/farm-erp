import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Clock, User, Building2, ShieldCheck, XCircle, CheckCircle2, Ban, MessageSquare, X, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import { AdminFormRequest } from '../core/types';
import { getAdminFormShiftLabel, getAdminFormStatusLabel, getApprovalStatusLabel } from '../core/constants';
import { getAdminFormTypeLabel } from '../../thiet-lap-cong-luong/core/constants';
import { BTN_CLOSE, BTN_EDIT } from '../../../../lib/button-labels';
import { useAuthStore } from '../../../../store/useStore';
import {
  useApproveAdminFormByManager,
  useRejectAdminFormByManager,
  useUpdateAdminFormGhiChu,
} from '../hooks/use-admin-form';

type ModalType = 'approve' | 'reject' | 'ghi_chu' | null;

interface Props {
  data: AdminFormRequest;
  onClose: () => void;
  onEdit?: (item: AdminFormRequest) => void;
  onDelete?: (id: string) => void;
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
  onDelete,
  onCancel,
  onApproveManager,
  onRejectManager,
  onApproveHcns,
  onRejectHcns,
}) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [modalType, setModalType] = useState<ModalType>(null);
  const [ghiChuValue, setGhiChuValue] = useState('');

  const approveMutation = useApproveAdminFormByManager();
  const rejectMutation = useRejectAdminFormByManager();
  const updateGhiChuMutation = useUpdateAdminFormGhiChu();

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

  const openApproveModal = () => {
    setGhiChuValue(data.ghi_chu ?? '');
    setModalType('approve');
  };
  const openRejectModal = () => {
    setGhiChuValue(data.ghi_chu ?? '');
    setModalType('reject');
  };
  const openGhiChuModal = () => {
    setGhiChuValue(data.ghi_chu ?? '');
    setModalType('ghi_chu');
  };

  const handleConfirmApprove = async () => {
    await approveMutation.mutateAsync(data.id);
    if (ghiChuValue.trim()) {
      await updateGhiChuMutation.mutateAsync({ id: data.id, ghiChu: ghiChuValue.trim() });
    }
    setModalType(null);
    onClose();
  };
  const handleConfirmReject = async () => {
    await rejectMutation.mutateAsync(data.id);
    if (ghiChuValue.trim()) {
      await updateGhiChuMutation.mutateAsync({ id: data.id, ghiChu: ghiChuValue.trim() });
    }
    setModalType(null);
    onClose();
  };
  const handleSaveGhiChu = async () => {
    await updateGhiChuMutation.mutateAsync({ id: data.id, ghiChu: ghiChuValue.trim() || null });
    setModalType(null);
  };

  const toolbarActions = useMemo<DetailToolbarAction[]>(() => {
    const actions: DetailToolbarAction[] = [];
    if (canManagerApprove) {
      actions.push({
        label: t('adminForm.detail.toolbar.approve'),
        icon: <CheckCircle2 size={16} />,
        onClick: openApproveModal,
        variant: 'success',
      });
      actions.push({
        label: t('adminForm.detail.toolbar.reject'),
        icon: <XCircle size={16} />,
        onClick: openRejectModal,
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
    actions.push({
      label: t('adminForm.detail.toolbar.ghiChu'),
      icon: <MessageSquare size={16} />,
      onClick: openGhiChuModal,
      variant: 'secondary',
    });
    if (onCancel && canCancel) {
      actions.push({
        label: t('adminForm.actions.cancel'),
        icon: <XCircle size={16} />,
        onClick: () => onCancel(data.id),
        variant: 'warning',
      });
    }
    return actions;
  }, [canCancel, canManagerApprove, canHcnsApprove, data.id, onApproveHcns, onRejectHcns, onCancel, t]);

  const renderFooter = (
    <div className="flex items-center justify-between w-full gap-2">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-2">
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
        {onDelete && (
          <Button
            variant="outline"
            onClick={() => {
              onDelete(data.id);
              onClose();
            }}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            <Trash2 size={16} className="mr-2" /> {t('common.delete')}
          </Button>
        )}
      </div>
    </div>
  );

  const isModalOpen = modalType !== null;
  const modalTitle =
    modalType === 'approve'
      ? t('adminForm.detail.popup.approveTitle')
      : modalType === 'reject'
        ? t('adminForm.detail.popup.rejectTitle')
        : t('adminForm.detail.popup.ghiChuTitle');

  return (
    <>
      <GenericDrawer
        title={t('adminForm.detail.title')}
        subtitle={getAdminFormTypeLabel(data.loai_phieu, t)}
        icon={<FileText size={18} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
      >
        <div className="space-y-5">
          {/* Detail toolbar lên trên cùng */}
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

          {/* Card summary: thông tin phiếu */}
          <DetailSection title={t('adminForm.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('adminForm.form.type')} value={getAdminFormTypeLabel(data.loai_phieu, t)} icon={<FileText size={12} />} />
              <DetailField label={t('adminForm.form.shift')} value={getAdminFormShiftLabel(data.ca, t)} icon={<Clock size={12} />} />
              <DetailField label={t('adminForm.form.date')} value={data.ngay ? formatDate(data.ngay) : data.ngay} icon={<Calendar size={12} />} />
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
              {data.ghi_chu != null && data.ghi_chu !== '' && (
                <DetailField label={t('adminForm.detail.ghiChu')} value={data.ghi_chu} icon={<MessageSquare size={12} />} className="col-span-full" />
              )}
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={t('adminForm.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('adminForm.detail.createdAt')} value={data.tg_tao ? formatDateTimeShort(data.tg_tao) : '—'} icon={<Calendar size={12} />} />
              <DetailField label={t('adminForm.detail.updatedAt')} value={data.tg_cap_nhat ? formatDateTimeShort(data.tg_cap_nhat) : '—'} icon={<Calendar size={12} />} />
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      {/* Popup: Duyệt / Từ chối / Ghi chú */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setModalType(null)}
            aria-hidden
          />
          <div className="relative bg-card rounded-xl p-6 w-full max-w-md shadow-xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{modalTitle}</h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                aria-label={t('adminForm.detail.popup.cancel')}
              >
                <X size={20} />
              </button>
            </div>
            <Textarea
              label={modalType === 'ghi_chu' ? t('adminForm.detail.ghiChu') : t('adminForm.detail.popup.ghiChuPlaceholder')}
              placeholder={t('adminForm.detail.popup.ghiChuPlaceholder')}
              value={ghiChuValue}
              onChange={(e) => setGhiChuValue(e.target.value)}
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setModalType(null)} className="border-border">
                {t('adminForm.detail.popup.cancel')}
              </Button>
              {modalType === 'approve' && (
                <Button
                  onClick={handleConfirmApprove}
                  isLoading={approveMutation.isPending || updateGhiChuMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {t('adminForm.detail.popup.confirm')}
                </Button>
              )}
              {modalType === 'reject' && (
                <Button
                  onClick={handleConfirmReject}
                  isLoading={rejectMutation.isPending || updateGhiChuMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {t('adminForm.detail.popup.confirm')}
                </Button>
              )}
              {modalType === 'ghi_chu' && (
                <Button
                  onClick={handleSaveGhiChu}
                  isLoading={updateGhiChuMutation.isPending}
                  className="bg-primary text-white"
                >
                  {t('adminForm.detail.popup.save')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminFormDetail;
