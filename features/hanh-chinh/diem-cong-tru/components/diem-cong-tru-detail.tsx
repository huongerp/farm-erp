import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, MessageSquareText, Printer, Scale, Unlock } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { formatDateTimeShort } from '../../../../lib/utils';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { getDiemCongTruLoaiLabel } from '../core/constants';
import { laBanGhiKhoa } from '../core/quyen-khoa';
import type { DiemCongTruRecord } from '../core/types';
import { useUpdateDiemCongTruQuanLyTraoDoi, useUpdateDiemCongTruTrangThai } from '../hooks/use-diem-cong-tru';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import DiemCongTruTrangThaiBadge from './diem-cong-tru-trang-thai-badge';
import DiemCongTruTraoDoiDialog from './diem-cong-tru-trao-doi-dialog';

interface Props {
  data: DiemCongTruRecord;
  onClose: () => void;
  onEdit: (item: DiemCongTruRecord) => void;
  onDelete?: (id: string) => void;
  /** Đã tính theo trạng thái khoá của bản ghi (coTheSua / coTheXoa). */
  canUpdate: boolean;
  canDelete: boolean;
  /** Quản trị module hoặc cấp bậc 1 (coTheDoiKhoa). */
  canDoiKhoa: boolean;
}

const formatPeriod = (nam: number, thang: number) =>
  `${nam}-${String(thang).padStart(2, '0')}`;

const DiemCongTruDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, canUpdate, canDelete, canDoiKhoa }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const trangThaiMutation = useUpdateDiemCongTruTrangThai();
  const [traoDoiOpen, setTraoDoiOpen] = useState(false);
  const traoDoiMutation = useUpdateDiemCongTruQuanLyTraoDoi(() => setTraoDoiOpen(false));
  const subtitle = `${data.ten_nhan_vien || data.ma_nhan_vien || '—'} · ${formatPeriod(data.nam, data.thang)}`;
  const dangKhoa = laBanGhiKhoa(data);

  const toolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [
      {
        label: t('diemCongTru.detail.printPhieu'),
        icon: <Printer size={16} />,
        variant: 'primary',
        onClick: () => window.open(`/hanh-chinh/diem-cong-tru/preview/${data.id}`, '_blank', 'noopener,noreferrer'),
      },
    ];
    if (canDoiKhoa) {
      actions.push({
        label: dangKhoa ? t('diemCongTru.detail.unlock') : t('diemCongTru.detail.lock'),
        icon: dangKhoa ? <Unlock size={16} /> : <Lock size={16} />,
        variant: dangKhoa ? 'success' : 'warning',
        disabled: trangThaiMutation.isPending,
        onClick: () =>
          confirm({
            title: dangKhoa ? t('diemCongTru.detail.unlockTitle') : t('diemCongTru.detail.lockTitle'),
            message: dangKhoa ? t('diemCongTru.detail.unlockMessage') : t('diemCongTru.detail.lockMessage'),
            variant: dangKhoa ? 'info' : 'warning',
            confirmText: dangKhoa ? t('diemCongTru.detail.unlock') : t('diemCongTru.detail.lock'),
            onConfirm: async () => {
              await trangThaiMutation.mutateAsync({ id: data.id, trang_thai: dangKhoa ? 'mo' : 'khoa' }).catch(() => {});
            },
          }),
      });
      actions.push({
        label: t('diemCongTru.detail.traoDoi'),
        icon: <MessageSquareText size={16} />,
        variant: 'secondary',
        onClick: () => setTraoDoiOpen(true),
      });
    }
    return actions;
  }, [t, data.id, dangKhoa, canDoiKhoa, confirm, trangThaiMutation]);

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

  const isCong = data.loai === 'cong';

  return (
    <GenericDrawer
      title={data.ten_hang_muc || data.ma_hang_muc || data.id_hang_muc}
      icon={<Scale size={20} />}
      subtitle={subtitle}
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
              {data.ten_hang_muc || data.ma_hang_muc || '—'}
            </h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {data.ten_nhan_vien || '—'}
              {data.ma_nhan_vien && (
                <span className="font-mono ml-1.5 text-muted-foreground">
                  ({data.ma_nhan_vien})
                </span>
              )}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  isCong
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {getDiemCongTruLoaiLabel(data.loai, t)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums font-medium">
                {formatPeriod(data.nam, data.thang)}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {data.diem} {t('diemCongTru.detail.points')}
              </span>
              <DiemCongTruTrangThaiBadge trangThai={data.trang_thai} />
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('diemCongTru.form.basicInfo')}
          icon={<Scale size={14} />}
          variant="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField
              label={t('diemCongTru.store.employeeCol')}
              value={
                data.ten_nhan_vien
                  ? `${data.ten_nhan_vien}${data.ma_nhan_vien ? ` (${data.ma_nhan_vien})` : ''}`
                  : data.ma_nhan_vien || '—'
              }
            />
            <DetailField
              label={t('diemCongTru.store.periodCol')}
              value={formatPeriod(data.nam, data.thang)}
            />
            <DetailField
              label={t('diemCongTru.store.loaiCol')}
              value={getDiemCongTruLoaiLabel(data.loai, t)}
            />
            <DetailField
              label={t('diemCongTru.store.categoryCol')}
              value={data.ten_hang_muc || data.ma_hang_muc || data.id_hang_muc || '—'}
            />
            <DetailField
              label={t('diemCongTru.store.diemCol')}
              value={String(data.diem)}
            />
            <DetailField
              label={t('diemCongTru.store.trangThaiCol')}
              value={<DiemCongTruTrangThaiBadge trangThai={data.trang_thai} />}
            />
            {data.mo_ta ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('diemCongTru.store.moTaCol')} value={data.mo_ta} />
              </div>
            ) : null}
            {data.quan_ly_trao_doi ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField
                  label={t('diemCongTru.detail.traoDoi')}
                  value={<span className="whitespace-pre-wrap">{data.quan_ly_trao_doi}</span>}
                />
              </div>
            ) : null}
            <DetailField
              label={t('diemCongTru.detail.createdAt')}
              value={formatDateTimeShort(data.tg_tao)}
            />
            <DetailField
              label={t('diemCongTru.store.updatedCol')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
            />
          </div>
        </DetailSection>
      </div>
      <DiemCongTruTraoDoiDialog
        open={traoDoiOpen}
        initialValue={data.quan_ly_trao_doi ?? ''}
        isSaving={traoDoiMutation.isPending}
        onClose={() => setTraoDoiOpen(false)}
        onSave={(noiDung) => traoDoiMutation.mutate({ id: data.id, noiDung })}
      />
    </GenericDrawer>
  );
};

export default DiemCongTruDetail;
