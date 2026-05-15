import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Edit, Lock, Trash2, Unlock, Users } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmBaoCaoNhanCong } from '../core/types';
import type { LoaiChuyen } from '../core/types';
import { chuyenTtLabelByThuTu, sumSlCongNgay, normalizeChiTietForDisplay, sumChiTietNumericPart } from '../core/types';
import { formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_BAO_CAO_NHAN_CONG } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useCopyBaoCaoNhanCongToNextDay, useUpdateBaoCaoNhanCongTrangThai } from '../hooks/use-bao-cao-nhan-cong';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from '../core/types';

interface Props {
  data: FarmBaoCaoNhanCong;
  existingList: FarmBaoCaoNhanCong[];
  onClose: () => void;
  onEdit?: (item: FarmBaoCaoNhanCong) => void;
  onDelete?: (id: string) => void;
  /** Sau khi copy sang ngày kế tiếp thành công: mở form sửa phiếu mới. */
  onAfterCopyToNextDay?: (newItem: FarmBaoCaoNhanCong) => void;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  /** Sao chép sang ngày kế (đã tính khóa / quyền). */
  canCopyNextDay?: boolean;
  /** Đổi trạng thái khóa — chỉ quản trị. */
  canToggleTrangThai?: boolean;
}

const BaoCaoNhanCongDetail: React.FC<Props> = ({
  data,
  existingList,
  onClose,
  onEdit,
  onDelete,
  onAfterCopyToNextDay,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  canCopyNextDay = true,
  canToggleTrangThai = false,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const copyMutation = useCopyBaoCaoNhanCongToNextDay();
  const trangThaiMutation = useUpdateBaoCaoNhanCongTrangThai();

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

  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);
  const ivAgg = sumChiTietNumericPart(production);
  const tongAgg = sumChiTietNumericPart([ivAgg, vRow]);

  const toolbarActions: DetailToolbarAction[] = [];
  if (canCopyNextDay) {
    toolbarActions.push({
      label: t('baoCaoNhanCong.detail.copyNextDay'),
      icon: <Copy size={16} />,
      variant: 'outline',
      disabled: copyMutation.isPending || trangThaiMutation.isPending,
      onClick: () => {
        copyMutation.mutate(
          { source: data, existingList },
          {
            onSuccess: (newItem) => {
              onAfterCopyToNextDay?.(newItem);
            },
          }
        );
      },
    });
  }
  if (canToggleTrangThai) {
    const locked = data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA;
    toolbarActions.push({
      label: locked ? t('baoCaoNhanCong.detail.toggleUnlock') : t('baoCaoNhanCong.detail.toggleLock'),
      icon: locked ? <Unlock size={16} /> : <Lock size={16} />,
      variant: 'outline',
      disabled: trangThaiMutation.isPending || copyMutation.isPending,
      onClick: () => {
        if (locked) {
          confirm({
            title: t('baoCaoNhanCong.confirmUnlockTitle'),
            message: t('baoCaoNhanCong.confirmUnlockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_BAO_CAO_NHAN_CONG.MO,
              });
            },
          });
        } else {
          confirm({
            title: t('baoCaoNhanCong.confirmLockTitle'),
            message: t('baoCaoNhanCong.confirmLockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA,
              });
            },
          });
        }
      },
    });
  }

  return (
    <GenericDrawer
      title={t('baoCaoNhanCong.detail.title')}
      subtitle={formatDateShort(data.ngay)}
      icon={<Users className="text-cyan-600" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_NHAN_CONG}
      footer={renderFooter}
    >
      <div className="space-y-4 pb-2">
        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}
        <DetailSection title={t('baoCaoNhanCong.detail.sectionOverview')} icon={<Users size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('baoCaoNhanCong.form.ngay')} value={formatDateShort(data.ngay)} />
            <DetailField label={t('baoCaoNhanCong.form.branch')} value={data.ten_chi_nhanh ?? '—'} />
            <DetailField
              label={t('baoCaoNhanCong.store.colTrangThai')}
              value={
                data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
                  ? t('baoCaoNhanCong.trangThai.khoa')
                  : t('baoCaoNhanCong.trangThai.mo')
              }
            />
            <DetailField label={t('baoCaoNhanCong.store.colTongCongNgay')} value={formatNumberVN(sumSlCongNgay(data))} />
            <DetailField label={t('baoCaoNhanCong.store.colNguoiTao')} value={data.ten_nguoi_tao ?? '—'} />
            <DetailField
              label={t('baoCaoNhanCong.form.ghiChuPhieu')}
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
            <DetailField label={t('baoCaoNhanCong.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('baoCaoNhanCong.form.sectionChuyen')} variant="primary">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[72rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-2 py-2 font-medium w-14">{t('baoCaoNhanCong.form.colTt')}</th>
                  <th className="text-left px-3 py-2 font-medium min-w-[9rem]">{t('baoCaoNhanCong.form.colChuyen')}</th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colSlNgay')}</th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colSlNua')}</th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colSlTangCa')}</th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colGioTc')}</th>
                  <th className="text-left px-2 py-2 font-medium min-w-[22rem] w-[24rem]">{t('baoCaoNhanCong.form.colGhiChu')}</th>
                </tr>
              </thead>
              <tbody>
                {production.map((row, idx) => {
                  const code = row.loai_chuyen as LoaiChuyen;
                  const labelKey = `baoCaoNhanCong.chuyen.${code}` as const;
                  const tt = chuyenTtLabelByThuTu(row.thu_tu && row.thu_tu > 0 ? row.thu_tu : idx + 1);
                  return (
                    <tr key={row.id || code} className="border-b border-border/80">
                      <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums">{tt}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t(labelKey)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(row.sl_cong_ngay)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(row.sl_cong_nua)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(row.sl_tang_ca)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(row.so_gio_tc)}</td>
                      <td className="px-2 py-2 text-muted-foreground min-w-[20rem] max-w-[32rem] align-top">
                        {row.ghi_chu?.trim() ? (
                          <div className="whitespace-pre-wrap text-sm leading-snug">{row.ghi_chu}</div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15">
                  <td className="px-2 py-2 text-center font-bold text-primary tabular-nums">IV</td>
                  <td className="px-3 py-2 font-bold text-primary">{t('baoCaoNhanCong.form.rowCongNhanDinhBien')}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_cong_ngay)}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_cong_nua)}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_tang_ca)}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.so_gio_tc)}</td>
                  <td className="px-2 py-2 text-muted-foreground text-sm">—</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums">V</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {t('baoCaoNhanCong.chuyen.CONG_DINH_BIEN_KHONG_SAN_XUAT')}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(vRow.sl_cong_ngay)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(vRow.sl_cong_nua)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(vRow.sl_tang_ca)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatNumberVN(vRow.so_gio_tc)}</td>
                  <td className="px-2 py-2 text-muted-foreground min-w-[20rem] max-w-[32rem] align-top">
                    {vRow.ghi_chu?.trim() ? (
                      <div className="whitespace-pre-wrap text-sm leading-snug">{vRow.ghi_chu}</div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0">
                  <td className="px-2 py-2.5 text-left font-bold text-primary sm:pl-3 tracking-tight" colSpan={2}>
                    {t('baoCaoNhanCong.form.rowTongNgay')}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_cong_ngay)}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_cong_nua)}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_tang_ca)}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.so_gio_tc)}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default BaoCaoNhanCongDetail;
