import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Sprout, ClipboardList } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmThuHoach } from '../core/types';
import { THU_HOACH_DAY_SUFFIXES } from '../core/types';
import { DAY_FORM_LABEL_KEY } from '../core/form-mappers';
import { formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import ThucTeDialog from './ThucTeDialog';

interface Props {
  data: FarmThuHoach;
  onClose: () => void;
  onEdit?: (item: FarmThuHoach) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const ThuHoachDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const [showThucTe, setShowThucTe] = useState(false);

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [];
    if (canUpdate) {
      actions.push({
        label: t('thuHoach.detail.toolbar.thucTe'),
        icon: <ClipboardList size={16} />,
        onClick: () => setShowThucTe(true),
        variant: 'info',
      });
    }
    return actions;
  }, [canUpdate, t]);

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {canUpdate && onEdit && (
          <Button
            onClick={() => {
              onEdit(data);
              onClose();
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {canDelete && onDelete && (
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
    <>
      <GenericDrawer
        title={t('thuHoach.detail.title')}
        subtitle={`${data.ten_chi_nhanh ?? '—'} · ${t('thuHoach.store.colNam')} ${data.nam} — ${t('thuHoach.store.colTuan')} ${data.tuan}`}
        icon={<Sprout className="text-emerald-600" size={22} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_DETAIL}
      >
        <div className="space-y-5">
          {toolbarActions.length > 0 && (
            <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
          )}

          <DetailSection title={t('thuHoach.detail.keHoach')} icon={<Sprout size={14} />} variant="primary">
            <DetailFieldGrid cols={2}>
              <DetailField label={t('thuHoach.store.colNam')} value={String(data.nam)} />
              <DetailField label={t('thuHoach.store.colTuan')} value={String(data.tuan)} />
              <DetailField label={t('thuHoach.store.colBranch')} value={data.ten_chi_nhanh ?? '—'} />
            </DetailFieldGrid>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THU_HOACH_DAY_SUFFIXES.map((s) => (
                <DetailField
                  key={s}
                  label={t(DAY_FORM_LABEL_KEY[s])}
                  value={formatNumberVN(Number(data[`ke_hoach_${s}` as keyof FarmThuHoach] ?? 0))}
                />
              ))}
            </div>
          </DetailSection>

          <DetailSection title={t('thuHoach.detail.thucTe')} icon={<ClipboardList size={14} />} variant="primary">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THU_HOACH_DAY_SUFFIXES.map((s) => (
                <DetailField
                  key={s}
                  label={t(DAY_FORM_LABEL_KEY[s])}
                  value={formatNumberVN(Number(data[`thuc_te_${s}` as keyof FarmThuHoach] ?? 0))}
                />
              ))}
            </div>
          </DetailSection>

          <DetailSection title={t('thuHoach.form.ghiChu')} variant="muted">
            <DetailFieldGrid cols={1}>
              <DetailField label={t('thuHoach.form.ghiChu')} value={data.ghi_chu ?? ''} emptyText="—" />
              <DetailField label={t('thuHoach.detail.traoDoi')} value={data.trao_doi ?? ''} emptyText="—" />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={t('thuHoach.store.colUpdated')} variant="muted">
            <DetailField label={t('thuHoach.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </DetailSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {showThucTe && <ThucTeDialog data={data} onClose={() => setShowThucTe(false)} />}
      </AnimatePresence>
    </>
  );
};

export default ThuHoachDetail;
