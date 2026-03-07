import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Zap, FileText, LayoutGrid } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateShort } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import TieuChiSubTable from '../../tieu-chi-kpi/components/TieuChiSubTable';
import type { HanhDongCotLoi } from '../core/types';
import type { TieuChiKpi } from '../../tieu-chi-kpi/core/types';
import { BSC_LABEL_KEYS } from '../core/constants';
import type { BscDimension } from '../core/types';

/** Bắt lỗi render của TieuChiSubTable để drawer không crash */
class TieuChiSubTableErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError = () => ({ hasError: true });

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('TieuChiSubTableErrorBoundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          Không thể tải danh sách tiêu chí KPI. Vui lòng thử lại sau.
        </div>
      );
    }
    return this.props.children;
  }
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value ?? '—'}</span>
    </div>
  );
}

interface Props {
  data: HanhDongCotLoi;
  chienLuocLabel: string;
  nhomLabel: string;
  onClose: () => void;
  onEdit: (item: HanhDongCotLoi) => void;
  onDelete: (id: string) => void;
  onTieuChiEdit?: (item: TieuChiKpi) => void;
  onTieuChiDelete?: (id: string) => void;
}

const HanhDongDetailDrawer: React.FC<Props> = ({
  data,
  chienLuocLabel,
  nhomLabel,
  onClose,
  onEdit,
  onDelete,
  onTieuChiEdit,
  onTieuChiDelete,
}) => {
  const { t } = useTranslation();

  const bscLabelKey = data?.bsc_dimension != null ? BSC_LABEL_KEYS[data.bsc_dimension as BscDimension] : null;
  const bscLabel = bscLabelKey ? t(bscLabelKey) : (data?.bsc_dimension ?? '—');

  const handleEdit = () => {
    onEdit(data);
    onClose();
  };

  const handleDelete = () => {
    onDelete(data.id);
    onClose();
  };

  const footer = (
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
          onClick={handleEdit}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit2 size={16} className="mr-2" /> {BTN_EDIT()}
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
      title={t('hanhDongCotLoi.detail.title')}
      subtitle={data.ten}
      icon={<Zap size={18} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl border border-border bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{data.ten}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {bscLabel}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">{data.ty_trong}%</span>
              </div>
            </div>
          </div>
        </div>

        <FormSection title={t('hanhDongCotLoi.form.sectionBasic')} icon={<FileText size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('hanhDongCotLoi.form.chienLuoc')} value={chienLuocLabel} />
            <DetailField label={t('hanhDongCotLoi.form.ten')} value={data.ten} />
            <DetailField label={t('hanhDongCotLoi.form.ma')} value={data.ma} />
            <DetailField label={t('hanhDongCotLoi.form.nhomHanhDong')} value={nhomLabel} />
          </div>
          {data.mo_ta && (
            <DetailField label={t('hanhDongCotLoi.form.moTa')} value={data.mo_ta} className="mt-3" />
          )}
        </FormSection>

        <FormSection title={t('hanhDongCotLoi.form.sectionBsc')} icon={<LayoutGrid size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('hanhDongCotLoi.form.bscDimension')}
              value={
                <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {bscLabel}
                </span>
              }
            />
            <DetailField label={t('hanhDongCotLoi.form.tyTrong')} value={`${data.ty_trong}%`} />
            <DetailField label={t('hanhDongCotLoi.form.thuTu')} value={data.thu_tu} />
            <DetailField
              label={t('hanhDongCotLoi.col.tgCapNhat')}
              value={formatDateShort(data.tg_cap_nhat)}
            />
          </div>
        </FormSection>

        <TieuChiSubTableErrorBoundary>
          <TieuChiSubTable
            hanhDongId={data.id}
            onEdit={onTieuChiEdit}
            onDelete={onTieuChiDelete}
          />
        </TieuChiSubTableErrorBoundary>
      </div>
    </GenericDrawer>
  );
};

export default HanhDongDetailDrawer;
