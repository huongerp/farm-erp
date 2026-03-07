import React from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Edit, Trash2 } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getPointGroupTypeLabel } from '../core/constants';
import type { PayrollPointGroup } from '../core/types';

interface Props {
  data: PayrollPointGroup;
  onClose: () => void;
  onEdit: (item: PayrollPointGroup) => void;
  onDelete?: (id: string) => void;
}

const PayrollPointGroupDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;
  const isCong = data.loai === 'cong';

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => {
              onDelete(data.id);
              onClose();
            }}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
          >
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={data.ten}
      icon={<Scale size={20} />}
      subtitle={`${data.ma} · ${getPointGroupTypeLabel(data.loai, t)}`}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div
            className={`h-14 w-14 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
              isCong
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald/20'
                : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose/20'
            }`}
          >
            <Scale size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  isCong
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {getPointGroupTypeLabel(data.loai, t)}
              </span>
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {t('payrollIp.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  {t('payrollIp.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection
          title={t('payrollIp.pointGroups.form.basicInfo')}
          icon={<Scale size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('payrollIp.pointGroups.store.maCol')}
              value={data.ma}
            />
            <DetailField
              label={t('payrollIp.pointGroups.store.tenCol')}
              value={data.ten}
            />
            <DetailField
              label={t('payrollIp.pointGroups.store.loaiCol')}
              value={getPointGroupTypeLabel(data.loai, t)}
            />
            <DetailField
              label={t('payrollIp.pointGroups.store.thuTuCol')}
              value={String(data.thu_tu)}
            />
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('payrollIp.pointGroups.store.noteCol')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField
              label={t('payrollIp.pointGroups.store.statusCol')}
              value={isActive ? t('payrollIp.active') : t('payrollIp.inactive')}
            />
            <DetailField
              label={t('payrollIp.pointGroups.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PayrollPointGroupDetail;
