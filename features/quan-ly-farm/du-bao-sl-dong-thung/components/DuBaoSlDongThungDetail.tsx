import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Printer, Unlock, Boxes } from 'lucide-react';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from '../core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_NHAN_CONG } from '../../../../components/shared/GenericDrawer';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useUpdateDuBaoSlDongThungTrangThai } from '../hooks/use-du-bao-sl-dong-thung';
import { getDuBaoSlDongThungPreviewUrl } from '../core/preview-url';
import DuBaoSlDongThungBangTinhTable from './DuBaoSlDongThungBangTinhTable';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';

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
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={canUpdate}
      canDelete={canDelete}
      onEdit={onEdit ? () => { onEdit(data);
              onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id);
              onClose(); } : undefined}
    />
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
