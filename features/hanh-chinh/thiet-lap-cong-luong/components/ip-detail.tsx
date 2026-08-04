import React from 'react';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useTranslation } from 'react-i18next';
import { Wifi } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import { formatDateTimeShort } from '../../../../lib/utils';
import type { PayrollWifiIp } from '../core/types';

interface Props {
  data: PayrollWifiIp;
  onClose: () => void;
  onEdit: (item: PayrollWifiIp) => void;
  onDelete?: (id: string) => void;
}

const PayrollWifiIpDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={() => { onEdit(data); onClose(); }}
      onDelete={onDelete ? () => { onDelete(data.id); onClose(); } : undefined}
    />
  );

  return (
    <GenericDrawer
      title={data.ip_wifi}
      icon={<Wifi size={20} />}
      subtitle={data.ten_chi_nhanh || data.id_chi_nhanh || '—'}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Wifi size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate font-mono">
              {data.ip_wifi}
            </h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {data.ten_chi_nhanh || data.id_chi_nhanh || '—'}
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
          title={t('payrollIp.form.basicInfo')}
          icon={<Wifi size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('payrollIp.store.branchCol')}
              value={data.ten_chi_nhanh || data.id_chi_nhanh || '—'}
            />
            <DetailField
              label={t('payrollIp.store.ipCol')}
              value={data.ip_wifi}
            />
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('payrollIp.store.noteCol')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField
              label={t('payrollIp.store.statusCol')}
              value={isActive ? t('payrollIp.active') : t('payrollIp.inactive')}
            />
            <DetailField
              label={t('payrollIp.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PayrollWifiIpDetail;
