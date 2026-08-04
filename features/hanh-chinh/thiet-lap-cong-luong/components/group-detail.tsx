import React from 'react';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getAdminFormTypeLabel } from '../core/constants';
import type { PayrollAdminFormGroup } from '../core/types';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

interface Props {
  data: PayrollAdminFormGroup;
  onClose: () => void;
  onEdit: (item: PayrollAdminFormGroup) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const PayrollFormGroupDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  const typeLabel = getAdminFormTypeLabel(data.loai_phieu, t);

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={canUpdate}
      canDelete={canDelete}
      onEdit={onEdit ? () => { onEdit(data);
            onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id);
              onClose(); } : undefined}
    />
  );

  return (
    <GenericDrawer
      title={typeLabel}
      icon={<FileText size={20} />}
      subtitle={`${t('payrollIp.groups.store.quotaCol')}: ${data.so_luong_thang}`}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {typeLabel}
            </h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {t('payrollIp.groups.store.quotaCol')}: {data.so_luong_thang}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('payrollIp.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('payrollIp.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection
          title={t('payrollIp.groups.form.basicInfo')}
          icon={<FileText size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('payrollIp.groups.store.typeCol')}
              value={typeLabel}
            />
            <DetailField
              label={t('payrollIp.groups.store.quotaCol')}
              value={String(data.so_luong_thang)}
            />
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('payrollIp.groups.store.noteCol')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField
              label={t('payrollIp.groups.store.statusCol')}
              value={isActive ? t('payrollIp.active') : t('payrollIp.inactive')}
            />
            <DetailField
              label={t('payrollIp.groups.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PayrollFormGroupDetail;
