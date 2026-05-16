import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Edit, Lock, Trash2, Unlock, Users, Images, Award } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmBaoCaoNhanCong } from '../core/types';
import type { LoaiChuyen } from '../core/types';
import {
  chuyenTtLabelByThuTu,
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichPhieu,
  sumTongGioTangCaTichTuChiTiet,
  sumTienThuongKpi,
  tongCongQuyDoiNgayVaNua,
  tongGioTangCaTichMotDong,
  normalizeChiTietForDisplay,
  sumChiTietNumericPart,
} from '../core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
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
  const ivQuyDoi = sumTongCongQuyDoiTuChiTiet(production);
  const vQuyDoi = tongCongQuyDoiNgayVaNua(vRow);
  const tongQuyDoiPhieu = sumTongCongQuyDoiPhieu(data);
  const ivGioTich = sumTongGioTangCaTichTuChiTiet(production);

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
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
                    data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100'
                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
                  )}
                >
                  {data.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA
                    ? t('baoCaoNhanCong.trangThai.khoa')
                    : t('baoCaoNhanCong.trangThai.mo')}
                </span>
              }
            />
            <DetailField label={t('baoCaoNhanCong.store.colTongCongNgay')} value={formatNumberVN(sumSlCongNgay(data))} />
            <DetailField label={t('baoCaoNhanCong.store.colTongCongNua')} value={formatNumberVN(sumSlCongNua(data))} />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongCongQuyDoi')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(sumTongCongQuyDoiPhieu(data))}</span>}
            />
            <DetailField label={t('baoCaoNhanCong.store.colTongTangCa')} value={formatNumberVN(sumSlTangCa(data))} />
            <DetailField label={t('baoCaoNhanCong.store.colGioTangCa')} value={formatNumberVN(sumSoGioTc(data))} />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongGioTangCa')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(sumTongGioTangCaTichPhieu(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongThuongKpi')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(sumTienThuongKpi(data))}</span>}
            />
            <DetailField label={t('baoCaoNhanCong.store.colNguoiTao')} value={data.ten_nguoi_tao ?? '—'} />
            <DetailField label={t('baoCaoNhanCong.store.colTgTao')} value={formatDateTimeShort(data.tg_tao)} />
            <DetailField label={t('baoCaoNhanCong.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
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
          </DetailFieldGrid>
        </DetailSection>

        {(data.hinh_anh_urls?.length ?? 0) > 0 && (
          <DetailSection title={t('baoCaoNhanCong.detail.sectionHinhAnh')} icon={<Images size={14} />} variant="primary">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {data.hinh_anh_urls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-border bg-muted/20 aspect-square hover:ring-2 hover:ring-primary/30 transition-shadow"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
          </DetailSection>
        )}

        <DetailSection title={t('baoCaoNhanCong.form.sectionChuyen')} variant="primary">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[86rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-2 py-2 font-medium w-14">{t('baoCaoNhanCong.form.colTt')}</th>
                  <th className="text-left px-3 py-2 font-medium min-w-[9rem]">{t('baoCaoNhanCong.form.colChuyen')}</th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colSlNgay')}</th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colSlNua')}</th>
                  <th className="text-right px-2 py-2 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/15">
                    {t('baoCaoNhanCong.form.colTongCongQuyDoi')}
                  </th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colSlTangCa')}</th>
                  <th className="text-right px-2 py-2 font-medium">{t('baoCaoNhanCong.form.colGioTangCa')}</th>
                  <th className="text-right px-2 py-2 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/15">
                    {t('baoCaoNhanCong.form.colTongGioTangCa')}
                  </th>
                  <th className="text-left px-2 py-2 font-medium min-w-[20rem] w-[22rem]">{t('baoCaoNhanCong.form.colGhiChu')}</th>
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
                      <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.sl_cong_ngay)}</td>
                      <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.sl_cong_nua)}</td>
                      <td className="px-2 py-2 text-right text-sm tabular-nums bg-primary/[0.06] dark:bg-primary/10 font-bold text-primary">
                        {formatNumberVN(tongCongQuyDoiNgayVaNua(row))}
                      </td>
                      <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.sl_tang_ca)}</td>
                      <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(row.so_gio_tc)}</td>
                      <td className="px-2 py-2 text-right text-sm tabular-nums bg-primary/[0.06] dark:bg-primary/10 font-bold text-primary">
                        {formatNumberVN(tongGioTangCaTichMotDong(row))}
                      </td>
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
                  <td className="px-2 py-2 text-right text-sm tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_cong_ngay)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_cong_nua)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums font-bold text-primary bg-primary/[0.08] dark:bg-primary/15">
                    {formatNumberVN(ivQuyDoi)}
                  </td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.sl_tang_ca)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums font-bold text-primary">{formatNumberVN(ivAgg.so_gio_tc)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums font-bold text-primary bg-primary/[0.08] dark:bg-primary/15">
                    {formatNumberVN(ivGioTich)}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground text-sm">—</td>
                </tr>
                <tr className="border-b border-border/80">
                  <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums">V</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {t('baoCaoNhanCong.chuyen.CONG_DINH_BIEN_KHONG_SAN_XUAT')}
                  </td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(vRow.sl_cong_ngay)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(vRow.sl_cong_nua)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums bg-primary/[0.06] dark:bg-primary/10 font-bold text-primary">
                    {formatNumberVN(vQuyDoi)}
                  </td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(vRow.sl_tang_ca)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums">{formatNumberVN(vRow.so_gio_tc)}</td>
                  <td className="px-2 py-2 text-right text-sm tabular-nums bg-primary/[0.06] dark:bg-primary/10 font-bold text-primary">
                    {formatNumberVN(tongGioTangCaTichMotDong(vRow))}
                  </td>
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
                  <td className="px-2 py-2.5 text-right text-sm tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_cong_ngay)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_cong_nua)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm tabular-nums font-bold text-primary text-base bg-primary/[0.1] dark:bg-primary/20">
                    {formatNumberVN(tongQuyDoiPhieu)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.sl_tang_ca)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm tabular-nums font-bold text-primary text-base">
                    {formatNumberVN(tongAgg.so_gio_tc)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm tabular-nums font-bold text-primary text-base bg-primary/[0.1] dark:bg-primary/20">
                    {formatNumberVN(sumTongGioTangCaTichPhieu(data))}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailSection>

        <DetailSection title={t('baoCaoNhanCong.detail.sectionKpi')} icon={<Award size={14} />} variant="primary">
          {(data.kpi?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t('baoCaoNhanCong.detail.kpiEmpty')}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm min-w-[48rem]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-center px-2 py-2 font-medium w-12">{t('baoCaoNhanCong.form.colTt')}</th>
                    <th className="text-left px-2 py-2 font-medium min-w-[9rem]">{t('baoCaoNhanCong.form.kpiColHangMuc')}</th>
                    <th className="text-left px-2 py-2 font-medium w-20">{t('baoCaoNhanCong.form.kpiColDvt')}</th>
                    <th className="text-left px-2 py-2 font-medium min-w-[5rem]">{t('baoCaoNhanCong.form.kpiColMucTieu')}</th>
                    <th className="text-left px-2 py-2 font-medium min-w-[5rem]">{t('baoCaoNhanCong.form.kpiColThucTe')}</th>
                    <th className="text-right px-2 py-2 font-medium w-24">{t('baoCaoNhanCong.form.kpiColPhanTram')}</th>
                    <th className="text-left px-2 py-2 font-medium min-w-[5rem]">{t('baoCaoNhanCong.form.kpiColDanhGia')}</th>
                    <th className="text-right px-2 py-2 font-medium w-28">{t('baoCaoNhanCong.form.kpiColTienThuong')}</th>
                    <th className="text-left px-2 py-2 font-medium min-w-[8rem]">{t('baoCaoNhanCong.form.kpiColGhiChu')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(data.kpi ?? [])]
                    .sort((a, b) => a.thu_tu - b.thu_tu)
                    .map((row, idx) => (
                      <tr key={row.id || `${row.thu_tu}-${idx}`} className="border-b border-border/80 last:border-0">
                        <td className="px-2 py-2 text-center text-muted-foreground tabular-nums">{idx + 1}</td>
                        <td className="px-2 py-2 text-sm">{row.ten_hang_muc?.trim() ? row.ten_hang_muc : '—'}</td>
                        <td className="px-2 py-2 text-sm text-muted-foreground">{row.don_vi_tinh?.trim() ? row.don_vi_tinh : '—'}</td>
                        <td className="px-2 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {row.muc_tieu?.trim() ? row.muc_tieu : '—'}
                        </td>
                        <td className="px-2 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {row.thuc_te?.trim() ? row.thuc_te : '—'}
                        </td>
                        <td className="px-2 py-2 text-right text-sm tabular-nums">
                          {row.phan_tram == null || !Number.isFinite(Number(row.phan_tram))
                            ? '—'
                            : `${formatNumberVN(Number(row.phan_tram))}%`}
                        </td>
                        <td className="px-2 py-2 text-sm">{row.danh_gia?.trim() ? row.danh_gia : '—'}</td>
                        <td className="px-2 py-2 text-right text-sm tabular-nums font-medium">
                          {formatNumberVN(row.tien_thuong)}
                        </td>
                        <td className="px-2 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {row.ghi_chu?.trim() ? row.ghi_chu : '—'}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-primary/10 dark:bg-primary/15 border-t border-border">
                    <td colSpan={7} className="px-3 py-2 text-right font-bold text-primary text-sm">
                      {t('baoCaoNhanCong.form.kpiRowTongThuong')}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-primary text-sm tabular-nums">
                      {formatNumberVN(sumTienThuongKpi(data))}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default BaoCaoNhanCongDetail;
