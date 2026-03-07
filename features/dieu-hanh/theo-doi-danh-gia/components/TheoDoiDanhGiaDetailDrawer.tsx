import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, ClipboardCheck, FileText, LayoutGrid } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { formatDateShort } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import type { KetQuaBaoCaoKpi } from '../core/types';
import type { TrangThaiBaoCaoKpi } from '../core/types';
import { TRANG_THAI_BAO_CAO_LABEL_KEYS } from '../core/constants';

function formatKy(r: KetQuaBaoCaoKpi): string {
  if (r.ky_thang != null) return `${r.ky_nam}-${String(r.ky_thang).padStart(2, '0')}`;
  if (r.ky_quy != null) return `${r.ky_nam}-Q${r.ky_quy}`;
  return String(r.ky_nam);
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
  data: KetQuaBaoCaoKpi;
  tieuChiLabel: string;
  phongBanLabel: string;
  mucTieuLabel: string;
  dvtLabel: string;
  onClose: () => void;
  onEdit: (item: KetQuaBaoCaoKpi) => void;
  onDelete: (id: string) => void;
}

const TheoDoiDanhGiaDetailDrawer: React.FC<Props> = ({
  data,
  tieuChiLabel,
  phongBanLabel,
  mucTieuLabel,
  dvtLabel,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

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
      title={t('theoDoiDanhGia.detail.title')}
      subtitle={tieuChiLabel}
      icon={<ClipboardCheck size={18} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl border border-border bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{tieuChiLabel}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{phongBanLabel}</span>
                <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {formatKy(data)}
                </span>
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                    data.trang_thai === 'da_danh_gia'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : data.trang_thai === 'da_gui'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                  )}
                >
                  {t(TRANG_THAI_BAO_CAO_LABEL_KEYS[data.trang_thai as TrangThaiBaoCaoKpi])}
                </span>
              </div>
            </div>
          </div>
        </div>

        <FormSection title={t('theoDoiDanhGia.form.sectionBasic')} icon={<FileText size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('theoDoiDanhGia.detail.tieuChi')} value={tieuChiLabel} />
            <DetailField label={t('theoDoiDanhGia.detail.phongBan')} value={phongBanLabel} />
            <DetailField label={t('theoDoiDanhGia.detail.ky')} value={formatKy(data)} />
            <DetailField label={t('theoDoiDanhGia.detail.trangThai')} value={t(TRANG_THAI_BAO_CAO_LABEL_KEYS[data.trang_thai as TrangThaiBaoCaoKpi])} />
          </div>
        </FormSection>

        <FormSection title={t('theoDoiDanhGia.detail.thucTe')} icon={<LayoutGrid size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('theoDoiDanhGia.detail.mucTieu')} value={mucTieuLabel} />
            <DetailField
              label={t('theoDoiDanhGia.detail.thucTe')}
              value={`${data.gia_tri_thuc_te}${dvtLabel ? ` ${dvtLabel}` : ''}`}
            />
            <DetailField
              label={t('theoDoiDanhGia.detail.diem')}
              value={data.diem_tinh != null ? String(data.diem_tinh) : '—'}
            />
            <DetailField label={t('theoDoiDanhGia.col.tgCapNhat')} value={formatDateShort(data.tg_cap_nhat)} />
          </div>
          {data.ghi_chu && (
            <DetailField label={t('theoDoiDanhGia.detail.ghiChu')} value={data.ghi_chu} className="mt-3" />
          )}
        </FormSection>
      </div>
    </GenericDrawer>
  );
};

export default TheoDoiDanhGiaDetailDrawer;
