import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Edit, Trash2, Power, Pin, PinOff, FileText, ExternalLink } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useHoSoById, useUpdateHoSo } from '../hooks/use-ho-so';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import type { HoSo } from '../core/types';

interface Props {
  data: HoSo;
  onClose: () => void;
  onEdit: (item: HoSo) => void;
  onDelete?: (id: string) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  /** Mở detail tài liệu cha (id_tai_lieu) để xem nhanh */
  onOpenTaiLieuDetail?: (idTaiLieu: string) => void;
}

const HoSoDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, isPinned, onTogglePin, onOpenTaiLieuDetail }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: freshData } = useHoSoById(data.id);
  const updateMutation = useUpdateHoSo(() => {});
  const displayData = freshData ?? data;

  const handleChangeStatus = () => {
    const newStatus = displayData.trang_thai === 1 ? 0 : 1;
    confirm({
      title: t('hoSo.detail.changeStatusTitle'),
      message: t('hoSo.detail.changeStatusMessage'),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: () =>
        updateMutation.mutate({
          id: displayData.id,
          data: {
            id_tai_lieu: displayData.id_tai_lieu,
            ma_ho_so: displayData.ma_ho_so,
            ten_ho_so: displayData.ten_ho_so,
            id_phong_ban: displayData.id_phong_ban ?? '',
            thoi_han_luu_tru: displayData.thoi_han_luu_tru ?? '',
            mo_ta: displayData.mo_ta ?? '',
            trang_thai: newStatus,
          },
        }),
    });
  };

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('hoSo.detail.changeStatus'),
      icon: <Power size={16} />,
      onClick: handleChangeStatus,
      variant: 'info',
    },
    ...(onTogglePin
      ? [
          {
            label: isPinned ? t('hoSo.unpin') : t('hoSo.pin'),
            icon: isPinned ? <PinOff size={16} /> : <Pin size={16} />,
            onClick: onTogglePin,
            variant: 'secondary' as const,
          },
        ]
      : []),
  ];

  const handleDelete = () => {
    if (onDelete) onDelete(displayData.id);
  };

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(displayData);
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
              handleDelete();
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
      title={displayData.ten_ho_so}
      icon={<FolderOpen size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FolderOpen size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{displayData.ten_ho_so}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{displayData.ma_ho_so}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {displayData.trang_thai === 1 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.activeStatus')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactiveStatus')}
                </span>
              )}
              {displayData.thoi_han_luu_tru && (
                <span className="text-xs text-muted-foreground">{formatDate(displayData.thoi_han_luu_tru)}</span>
              )}
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection title={t('hoSo.form.basicInfo')} icon={<FolderOpen size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('hoSo.form.maHoSo')} value={displayData.ma_ho_so} />
            <DetailField label={t('hoSo.form.tenHoSo')} value={displayData.ten_ho_so} />
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">{t('hoSo.detail.taiLieuCha')}</span>
              {displayData.id_tai_lieu && onOpenTaiLieuDetail ? (
                <button
                  type="button"
                  onClick={() => onOpenTaiLieuDetail(displayData.id_tai_lieu)}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                >
                  <FileText size={14} />
                  {displayData.ten_tai_lieu || displayData.id_tai_lieu}
                  <ExternalLink size={12} className="opacity-70" />
                </button>
              ) : (
                <span className="text-sm text-foreground">
                  {displayData.ten_tai_lieu || (displayData.id_tai_lieu ? displayData.id_tai_lieu : '—')}
                </span>
              )}
            </div>
            <DetailField label={t('hoSo.store.phongQuanLyCol')} value={displayData.ten_phong_ban || '—'} />
            <DetailField
              label={t('hoSo.form.thoiHanLuuTru')}
              value={displayData.thoi_han_luu_tru ? formatDate(displayData.thoi_han_luu_tru) : '—'}
            />
            <DetailField
              label={t('hoSo.form.status')}
              value={displayData.trang_thai === 1 ? t('common.activeStatus') : t('common.inactiveStatus')}
            />
            {displayData.mo_ta ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('hoSo.form.moTa')} value={displayData.mo_ta} />
              </div>
            ) : null}
            <DetailField label={t('hoSo.store.updatedCol')} value={formatDateTimeShort(displayData.tg_cap_nhat)} />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default HoSoDetail;
