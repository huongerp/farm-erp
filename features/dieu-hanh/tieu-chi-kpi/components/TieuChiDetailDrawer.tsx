import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Gauge, FileText, LayoutGrid, ClipboardCheck } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateShort } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import type { TieuChiKpi } from '../core/types';
import { LOAI_DO_LUONG_LABEL_KEYS, TAN_SUAT_LABEL_KEYS } from '../core/constants';
import type { LoaiDoLuong, TanSuat } from '../core/types';

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
  data: TieuChiKpi;
  hanhDongLabel: string;
  dvtLabel: string;
  ctdLabel: string;
  onClose: () => void;
  onEdit: (item: TieuChiKpi) => void;
  onDelete: (id: string) => void;
}

const TieuChiDetailDrawer: React.FC<Props> = ({
  data,
  hanhDongLabel,
  dvtLabel,
  ctdLabel,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      title={t('tieuChiKpi.detail.title')}
      subtitle={data.ten}
      icon={<Gauge size={18} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl border border-border bg-primary/10 flex items-center justify-center shrink-0">
              <Gauge className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{data.ten}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                    data.loai === 'xuoi'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  )}
                >
                  {t(LOAI_DO_LUONG_LABEL_KEYS[data.loai as LoaiDoLuong])}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {t(TAN_SUAT_LABEL_KEYS[data.tan_suat as TanSuat])}
                </span>
              </div>
            </div>
          </div>
        </div>

        <FormSection title={t('tieuChiKpi.form.sectionBasic')} icon={<FileText size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('tieuChiKpi.form.hanhDong')} value={hanhDongLabel} />
            <DetailField label={t('tieuChiKpi.form.ten')} value={data.ten} />
            <DetailField label={t('tieuChiKpi.form.ma')} value={data.ma} />
            <DetailField label={t('tieuChiKpi.form.donViTinh')} value={dvtLabel} />
          </div>
          {data.mo_ta && (
            <DetailField label={t('tieuChiKpi.form.moTa')} value={data.mo_ta} className="mt-3" />
          )}
        </FormSection>

        <FormSection title={t('tieuChiKpi.form.sectionDoLuong')} icon={<LayoutGrid size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('tieuChiKpi.form.loai')} value={t(LOAI_DO_LUONG_LABEL_KEYS[data.loai as LoaiDoLuong])} />
            <DetailField label={t('tieuChiKpi.form.giaTriMucTieu')} value={`${data.gia_tri_muc_tieu} ${dvtLabel}`} />
            <DetailField label={t('tieuChiKpi.form.giaTriToiThieu')} value={data.gia_tri_toi_thieu != null ? `${data.gia_tri_toi_thieu} ${dvtLabel}` : null} />
            <DetailField label={t('tieuChiKpi.form.cachTinhDiem')} value={ctdLabel} />
            <DetailField label={t('tieuChiKpi.form.tanSuat')} value={t(TAN_SUAT_LABEL_KEYS[data.tan_suat as TanSuat])} />
          </div>
        </FormSection>

        <FormSection title={t('tieuChiKpi.form.sectionTyTrong')} icon={<LayoutGrid size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('tieuChiKpi.form.tyTrong')} value={`${data.ty_trong}%`} />
            <DetailField label={t('tieuChiKpi.form.thuTu')} value={data.thu_tu} />
            <DetailField label={t('tieuChiKpi.form.nguonDuLieu')} value={data.nguon_du_lieu} />
            <DetailField label={t('tieuChiKpi.col.tgCapNhat')} value={formatDateShort(data.tg_cap_nhat)} />
          </div>
          {data.ghi_chu && (
            <DetailField label={t('tieuChiKpi.form.ghiChu')} value={data.ghi_chu} className="mt-3" />
          )}
        </FormSection>

        <div className="pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/dieu-hanh/theo-doi-danh-gia?tieu_chi=${data.id}`);
            }}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ClipboardCheck size={16} />
            {t('tieuChiKpi.detail.viewBaoCao')}
          </button>
        </div>
      </div>
    </GenericDrawer>
  );
};

export default TieuChiDetailDrawer;
