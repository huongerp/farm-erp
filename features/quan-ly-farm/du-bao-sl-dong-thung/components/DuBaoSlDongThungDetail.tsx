import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Lock, Printer, Trash2, Unlock, Boxes } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from '../core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_NHAN_CONG } from '../../../../components/shared/GenericDrawer';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useUpdateDuBaoSlDongThungTrangThai } from '../hooks/use-du-bao-sl-dong-thung';
import { getDuBaoSlDongThungPreviewUrl } from '../core/preview-url';
import DuBaoSlDongThungBangTinhTable from './DuBaoSlDongThungBangTinhTable';

interface Props {
  data: FarmDuBaoSlDongThung;
  onClose: () => void;
  onEdit?: (item: FarmDuBaoSlDongThung) => void;
  onDelete?: (id: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canToggleTrangThai?: boolean;
}

const DuBaoSlDongThungDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
  canToggleTrangThai = false,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const trangThaiMutation = useUpdateDuBaoSlDongThungTrangThai();
  const kpi = computeDuBaoSlDongThungKpiFromFarm(data);

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

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('duBaoSlDongThung.detail.printReport'),
      icon: <Printer size={16} />,
      variant: 'primary',
      onClick: () => window.open(getDuBaoSlDongThungPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
    },
  ];
  if (canToggleTrangThai) {
    const locked = data.trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA;
    toolbarActions.push({
      label: locked ? t('duBaoSlDongThung.detail.toggleUnlock') : t('duBaoSlDongThung.detail.toggleLock'),
      icon: locked ? <Unlock size={16} /> : <Lock size={16} />,
      variant: 'outline',
      disabled: trangThaiMutation.isPending,
      onClick: () => {
        if (locked) {
          confirm({
            title: t('duBaoSlDongThung.confirmUnlockTitle'),
            message: t('duBaoSlDongThung.confirmUnlockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_DU_BAO_SL_DONG_THUNG.MO,
              });
            },
          });
        } else {
          confirm({
            title: t('duBaoSlDongThung.confirmLockTitle'),
            message: t('duBaoSlDongThung.confirmLockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA,
              });
            },
          });
        }
      },
    });
  }

  const cellNum = (n: number | null, bold?: boolean) => (
    <span className={cn('tabular-nums text-sm', bold ? 'font-bold text-primary' : 'text-foreground')}>
      {n == null ? '—' : formatNumberVN(n)}
    </span>
  );

  return (
    <GenericDrawer
      title={t('duBaoSlDongThung.detail.title')}
      subtitle={formatDateShort(data.ngay)}
      icon={<Boxes className="text-violet-600" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_NHAN_CONG}
      footer={renderFooter}
    >
      <div className="space-y-4 pb-2">
        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}
        <DetailSection title={t('duBaoSlDongThung.detail.sectionOverview')} icon={<Boxes size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('duBaoSlDongThung.form.ngay')} value={formatDateShort(data.ngay)} />
            <DetailField label={t('duBaoSlDongThung.form.branch')} value={data.ten_chi_nhanh ?? '—'} />
            <DetailField
              label={t('duBaoSlDongThung.store.colTrangThai')}
              value={
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
                    data.trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100'
                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
                  )}
                >
                  {data.trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA
                    ? t('duBaoSlDongThung.trangThai.khoa')
                    : t('duBaoSlDongThung.trangThai.mo')}
                </span>
              }
            />
            <DetailField
              label={t('duBaoSlDongThung.store.colTongSoThungKeHoach')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(kpi.tong_so_thung_ke_hoach)}</span>}
            />
            <DetailField
              label={t('duBaoSlDongThung.store.colTongSoThungThucTe')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(kpi.tong_so_thung_thuc_te)}</span>}
            />
            <DetailField label={t('duBaoSlDongThung.store.colNguoiTao')} value={data.ten_nguoi_tao ?? '—'} />
            <DetailField label={t('duBaoSlDongThung.store.colTgTao')} value={formatDateTimeShort(data.tg_tao)} />
            <DetailField label={t('duBaoSlDongThung.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
            <DetailField
              label={t('duBaoSlDongThung.form.ghiChuPhieu')}
              value={
                data.ghi_chu?.trim() ? (
                  <div className="whitespace-pre-wrap text-body-sm leading-relaxed">{data.ghi_chu}</div>
                ) : (
                  ''
                )
              }
              emptyText="—"
              className="sm:col-span-2"
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('duBaoSlDongThung.form.sectionBangTinh')} variant="primary">
          <DuBaoSlDongThungBangTinhTable data={data} />
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DuBaoSlDongThungDetail;
