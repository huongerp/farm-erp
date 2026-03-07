import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Target, FileText, Calendar } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_DELETE } from '../../../../lib/button-labels';
import { formatDateShort } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import HanhDongSubTable from '../../hanh-dong-cot-loi/components/HanhDongSubTable';
import { useDeleteHanhDongCotLoi } from '../../hanh-dong-cot-loi/hooks/use-hanh-dong-cot-loi';
import type { ChienLuoc } from '../core/types';
import {
  TRANG_THAI_DUYET_LABEL_KEYS,
  TRANG_THAI_TRIEN_KHAI_LABEL_KEYS,
} from '../core/constants';
import type { TrangThaiDuyet, TrangThaiTrienKhai } from '../core/types';

const BADGE_DUYET: Record<TrangThaiDuyet, string> = {
  cho_duyet: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  da_duyet: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  khong_duyet: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const BADGE_TRIEN_KHAI: Record<TrangThaiTrienKhai, string> = {
  chua_bat_dau: 'bg-muted text-muted-foreground border-border',
  dang_trien_khai: 'bg-primary/10 text-primary border-primary/20',
  tam_ngung: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  huy: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

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
  data: ChienLuoc;
  onClose: () => void;
  onEdit: (item: ChienLuoc) => void;
  onDelete: (id: string) => void;
}

const ChienLuocDetailDrawer: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const deleteHanhDongMutation = useDeleteHanhDongCotLoi();

  const handleEdit = () => {
    onEdit(data);
    onClose();
  };

  const handleDelete = () => {
    onDelete(data.id);
    onClose();
  };

  const handleHanhDongEdit = (item: { id: string }) => {
    onClose();
    navigate(`/dieu-hanh/hanh-dong-cot-loi?edit=${item.id}`);
  };

  const handleHanhDongDelete = (id: string) => {
    confirm({
      title: t('hanhDongCotLoi.deleteTitle'),
      message: t('hanhDongCotLoi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteHanhDongMutation.mutate(id),
    });
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
      title={t('chienLuoc.detail.title')}
      subtitle={data.ten}
      icon={<Target size={18} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="flex flex-col gap-5">
        {/* Header card with badges */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl border border-border bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{data.ten}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {data.loai_tows}
                </span>
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                    BADGE_DUYET[data.trang_thai_duyet]
                  )}
                >
                  {t(TRANG_THAI_DUYET_LABEL_KEYS[data.trang_thai_duyet])}
                </span>
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-md text-xs font-medium border',
                    BADGE_TRIEN_KHAI[data.trang_thai_trien_khai]
                  )}
                >
                  {t(TRANG_THAI_TRIEN_KHAI_LABEL_KEYS[data.trang_thai_trien_khai])}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Thông tin cơ bản */}
        <FormSection title={t('chienLuoc.form.sectionBasic')} icon={<FileText size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('chienLuoc.form.ten')} value={data.ten} />
            <DetailField label={t('chienLuoc.form.nam')} value={data.nam} />
            <DetailField label={t('chienLuoc.form.ma')} value={data.ma} />
            <DetailField label={t('chienLuoc.form.nhomChienLuoc')} value={data.nhom_chien_luoc} />
          </div>
          {data.mo_ta && (
            <DetailField label={t('chienLuoc.form.moTa')} value={data.mo_ta} className="mt-3" />
          )}
        </FormSection>

        {/* Section: TOWS & Nhóm chiến lược */}
        <FormSection title={t('chienLuoc.form.sectionTows')} icon={<Target size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('chienLuoc.form.loaiTows')} value={data.loai_tows} />
            <DetailField label={t('chienLuoc.form.nhomChienLuoc')} value={data.nhom_chien_luoc} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <DetailField
              label={t('chienLuoc.form.idStrengths')}
              value={data.id_strengths.length > 0 ? `${data.id_strengths.length} yếu tố` : '—'}
            />
            <DetailField
              label={t('chienLuoc.form.idWeaknesses')}
              value={data.id_weaknesses.length > 0 ? `${data.id_weaknesses.length} yếu tố` : '—'}
            />
            <DetailField
              label={t('chienLuoc.form.idOpportunities')}
              value={data.id_opportunities.length > 0 ? `${data.id_opportunities.length} yếu tố` : '—'}
            />
            <DetailField
              label={t('chienLuoc.form.idThreats')}
              value={data.id_threats.length > 0 ? `${data.id_threats.length} yếu tố` : '—'}
            />
          </div>
        </FormSection>

        {/* Section: Trạng thái & Thời gian */}
        <FormSection title={t('chienLuoc.form.sectionStatus')} icon={<Calendar size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('chienLuoc.form.trangThaiDuyet')}
              value={
                <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', BADGE_DUYET[data.trang_thai_duyet])}>
                  {t(TRANG_THAI_DUYET_LABEL_KEYS[data.trang_thai_duyet])}
                </span>
              }
            />
            <DetailField
              label={t('chienLuoc.form.trangThaiTrienKhai')}
              value={
                <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium border', BADGE_TRIEN_KHAI[data.trang_thai_trien_khai])}>
                  {t(TRANG_THAI_TRIEN_KHAI_LABEL_KEYS[data.trang_thai_trien_khai])}
                </span>
              }
            />
            <DetailField
              label={t('chienLuoc.form.ngayBatDau')}
              value={data.ngay_bat_dau ? formatDateShort(data.ngay_bat_dau) : null}
            />
            <DetailField
              label={t('chienLuoc.form.ngayKetThuc')}
              value={data.ngay_ket_thuc ? formatDateShort(data.ngay_ket_thuc) : null}
            />
            <DetailField label={t('chienLuoc.form.uuTien')} value={data.uu_tien} />
            <DetailField
              label={t('chienLuoc.detail.tgCapNhat')}
              value={formatDateShort(data.tg_cap_nhat)}
            />
          </div>
          {data.ghi_chu && (
            <DetailField label={t('chienLuoc.form.ghiChu')} value={data.ghi_chu} className="mt-3" />
          )}
        </FormSection>

        <HanhDongSubTable
          chienLuocId={data.id}
          isApproved={data.trang_thai_duyet === 'da_duyet'}
          onEdit={handleHanhDongEdit}
          onDelete={handleHanhDongDelete}
        />
      </div>
    </GenericDrawer>
  );
};

export default ChienLuocDetailDrawer;
