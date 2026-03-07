import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Target, ClipboardList, Hash, FileText, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import type { KpiIndicator, KpiCycle } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';

const cycleLabel = (cycle: KpiCycle, t: (k: string) => string) => {
  switch (cycle) {
    case 'month': return t('chucNangNhiemVu.form.cycleMonth');
    case 'quarter': return t('chucNangNhiemVu.form.cycleQuarter');
    case 'year': return t('chucNangNhiemVu.form.cycleYear');
    default: return cycle;
  }
};

interface Props {
  data: KpiIndicator;
  onClose: () => void;
  onEdit: (k: KpiIndicator) => void;
  onDelete: (id: string) => void;
}

const KpiDetailDrawer: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const isActive = data.trang_thai === 1;

  const handleDelete = () => {
    confirm({
      title: t('chucNangNhiemVu.deleteKpiTitle'),
      message: t('chucNangNhiemVu.deleteKpiMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        onDelete(data.id);
        onClose();
      },
    });
  };

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
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
        <Button
          variant="ghost"
          onClick={handleDelete}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('chucNangNhiemVu.kpiDetailTitle')}
      subtitle={data.ten_chi_so}
      icon={<Target size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Target size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_chi_so}</h2>
            {data.ten_nhiem_vu && (
              <p className="text-body-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <ClipboardList size={12} /> {data.ten_nhiem_vu}
              </p>
            )}
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('chucNangNhiemVu.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('chucNangNhiemVu.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('chucNangNhiemVu.detailSectionInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('chucNangNhiemVu.form.kpiName')} value={data.ten_chi_so} icon={<Target size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.task')} value={data.ten_nhiem_vu ?? '—'} icon={<ClipboardList size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.unit')} value={data.don_vi} icon={<Hash size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.target')} value={data.chi_tieu_nguong} icon={<FileText size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.cycle')} value={cycleLabel(data.chu_ky_danh_gia, t)} icon={<FileText size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.order')} value={String(data.thu_tu)} icon={<Hash size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.status')} value={isActive ? t('chucNangNhiemVu.active') : t('chucNangNhiemVu.inactive')} icon={<FileText size={12} />} />
            <DetailField label={t('chucNangNhiemVu.detailUpdated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default KpiDetailDrawer;
