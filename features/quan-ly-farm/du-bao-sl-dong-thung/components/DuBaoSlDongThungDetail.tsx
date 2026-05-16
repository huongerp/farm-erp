import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Lock, Trash2, Unlock, Boxes } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from '../core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_NHAN_CONG } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useUpdateDuBaoSlDongThungTrangThai } from '../hooks/use-du-bao-sl-dong-thung';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';

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

  const toolbarActions: DetailToolbarAction[] = [];
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

  const pct = (r: number) => `${formatNumberVN(Math.round(r * 10000) / 100)}%`;

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
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[42rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-2 py-2 font-medium w-12">{t('duBaoSlDongThung.form.colStt')}</th>
                  <th className="text-left px-3 py-2 font-medium min-w-[12rem]">{t('duBaoSlDongThung.form.colHangMuc')}</th>
                  <th className="text-right px-2 py-2 font-medium min-w-[8rem]">{t('duBaoSlDongThung.form.colGiaTri')}</th>
                  <th className="text-left px-2 py-2 font-medium w-28">{t('duBaoSlDongThung.form.colDonVi')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[14rem]">{t('duBaoSlDongThung.form.colGhiChu')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">1</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row1')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(data.so_buong_can_mau)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row1Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">2</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row2')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(data.tong_can_nang_mau)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row2Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums">3</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row3')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(kpi.can_nang_binh_quan_buong)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row3Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">4</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row4')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(data.tong_buong_nhap_ke_hoach)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row4Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums">5</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row5')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(kpi.tong_khoi_luong_ke_hoach)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row5Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">6</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row6')}</td>
                  <td className="px-2 py-2 text-right">{pct(data.ty_le_thu_hoi_ke_hoach)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitPercent')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row6Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums">7</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row7')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(kpi.khoi_luong_dong_thung_ke_hoach)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row7Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">8</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row8')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(data.quy_cach_dong_thung_ke_hoach)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row8Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15">
                  <td className="px-2 py-2 text-center font-bold text-primary tabular-nums">9</td>
                  <td className="px-3 py-2 font-bold text-primary">{t('duBaoSlDongThung.form.row9')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(kpi.tong_so_thung_ke_hoach, true)}</td>
                  <td className="px-2 py-2 font-medium text-primary">{t('duBaoSlDongThung.form.unitThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row9Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">10</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row10')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(data.tong_buong_nhap_thuc_te)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitBuong')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row10Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums">11</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row11')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(kpi.tong_khoi_luong_thuc_te)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row11Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">12</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row12')}</td>
                  <td className="px-2 py-2 text-right">{pct(data.ty_le_thu_hoi_thuc_te)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitPercent')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row12Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-muted/20">
                  <td className="px-2 py-2 text-center tabular-nums">13</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row13')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(kpi.khoi_luong_dong_thung_thuc_te)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKg')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row13Note')}</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center tabular-nums">14</td>
                  <td className="px-3 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.row14')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(data.quy_cach_dong_thung_thuc_te)}</td>
                  <td className="px-2 py-2 text-muted-foreground">{t('duBaoSlDongThung.form.unitKgPerThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row14Note')}</td>
                </tr>
                <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0">
                  <td className="px-2 py-2 text-center font-bold text-primary tabular-nums">15</td>
                  <td className="px-3 py-2 font-bold text-primary">{t('duBaoSlDongThung.form.row15')}</td>
                  <td className="px-2 py-2 text-right">{cellNum(kpi.tong_so_thung_thuc_te, true)}</td>
                  <td className="px-2 py-2 font-medium text-primary">{t('duBaoSlDongThung.form.unitThung')}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{t('duBaoSlDongThung.form.row15Note')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DuBaoSlDongThungDetail;
