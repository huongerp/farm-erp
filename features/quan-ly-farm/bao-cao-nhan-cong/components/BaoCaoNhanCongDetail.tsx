import React from 'react';
import BaoCaoNhanCongDetailChuyenRow from './BaoCaoNhanCongDetailChuyenRow';
import { useTranslation } from 'react-i18next';
import { Copy, Edit, Lock, Printer, Trash2, Unlock, Users, Images } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichTuChiTiet,
  sumTongGioTangCaTichPhieu,
  normalizeChiTietForDisplay,
} from '../core/types';
import { formatGioTbVN, sumDisplayLoaiTotalsOnRows, tongGioCongNgayVaNua } from '../core/ct-sub';
import {
  bcncTableClass,
  bcncColChuyen,
  bcncColNum,
  bcncColTongGio,
  bcncColGhiChu,
  bcncThGroup,
  bcncThSub,
  bcncTdChuyen,
  bcncTdMainNum,
  bcncTdQuyDoi,
  bcncTdTongGio,
  bcncTdTongGioTc,
  bcncTdGhiChu,
} from '../core/bcnc-detail-table';
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
import { getBaoCaoNhanCongPreviewUrl } from '../core/preview-url';

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
  const ivQuyDoi = sumTongCongQuyDoiTuChiTiet(production);
  const tongQuyDoiPhieu = sumTongCongQuyDoiPhieu(data);
  const ivCnNgay = sumDisplayLoaiTotalsOnRows(production, 'CN_NGAY');
  const ivCnNua = sumDisplayLoaiTotalsOnRows(production, 'CN_NUA');
  const ivTangCa = sumDisplayLoaiTotalsOnRows(production, 'TANG_CA');
  const ivTongGioNgayNua = tongGioCongNgayVaNua(ivCnNgay, ivCnNua);
  const ivTongGioTc = sumTongGioTangCaTichTuChiTiet(production);
  const tongCnNgay = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NGAY');
  const tongCnNua = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NUA');
  const tongTangCa = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'TANG_CA');
  const tongTongGioNgayNua = tongGioCongNgayVaNua(tongCnNgay, tongCnNua);
  const tongTongGioTc = sumTongGioTangCaTichPhieu(data);

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('baoCaoNhanCong.detail.printReport'),
      icon: <Printer size={16} />,
      variant: 'primary',
      onClick: () => window.open(getBaoCaoNhanCongPreviewUrl(data.id), '_blank', 'noopener,noreferrer'),
    },
  ];
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
          <DetailFieldGrid cols={3} className="gap-y-3">
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
            <DetailField
              label={t('baoCaoNhanCong.store.colTongCongNgay')}
              value={<span className="tabular-nums">{formatNumberVN(sumSlCongNgay(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongCongNua')}
              value={<span className="tabular-nums">{formatNumberVN(sumSlCongNua(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongCongQuyDoi')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(sumTongCongQuyDoiPhieu(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongTangCa')}
              value={<span className="tabular-nums">{formatNumberVN(sumSlTangCa(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colGioTangCa')}
              value={<span className="tabular-nums">{formatNumberVN(sumSoGioTc(data))}</span>}
            />
            <DetailField
              label={t('baoCaoNhanCong.store.colTongGioTangCa')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(sumTongGioTangCaTichPhieu(data))}</span>}
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
              className="sm:col-span-2 lg:col-span-3"
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
            <table className={bcncTableClass}>
              <thead>
                <tr className="bg-muted/50 border-b border-border/60">
                  <th rowSpan={2} className={`text-center px-2 py-2 font-medium w-14 align-middle border-b border-border ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTt')}
                  </th>
                  <th rowSpan={2} className={`text-left px-2 py-2 font-medium align-middle border-b border-border ${bcncColChuyen} ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colChuyen')}
                  </th>
                  <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colSlNgay')}
                  </th>
                  <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colSlNua')}
                  </th>
                  <th rowSpan={2} className={`text-right px-2 py-2 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/15 align-middle border-b border-border ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTongCongQuyDoi')}
                  </th>
                  <th rowSpan={2} className={`text-right px-2 py-1.5 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/12 align-middle border-b border-border ${bcncColTongGio} ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTongGio')}
                  </th>
                  <th colSpan={2} className={`text-center px-2 py-1.5 font-medium border-b border-border/60 ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colSlTangCa')}
                  </th>
                  <th rowSpan={2} className={`text-right px-2 py-1.5 font-semibold text-primary bg-primary/[0.08] dark:bg-primary/12 align-middle border-b border-border ${bcncColTongGio} ${bcncThGroup}`}>
                    {t('baoCaoNhanCong.form.colTongGioTc')}
                  </th>
                  <th rowSpan={2} className={`text-left px-2 py-2 font-medium align-middle border-b border-border ${bcncColGhiChu}`}>
                    {t('baoCaoNhanCong.form.colGhiChu')}
                  </th>
                </tr>
                <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
                  <th className={`text-right px-1 py-1 font-medium text-[11px] ${bcncColNum} ${bcncThSub}`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
                </tr>
              </thead>
              <tbody>
                {production.map((row, idx) => (
                  <BaoCaoNhanCongDetailChuyenRow key={row.id || row.loai_chuyen} row={row} idx={idx} />
                ))}
                <tr className="border-b border-border/80 bg-primary/10 dark:bg-primary/15 font-semibold">
                  <td className={`${bcncTdMainNum} text-center text-primary`}>IV</td>
                  <td className={`${bcncTdChuyen} text-primary`}>{t('baoCaoNhanCong.form.rowCongNhanDinhBien')}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivCnNgay.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivCnNgay.nhanSu, ivCnNgay.tongGio)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivCnNua.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivCnNua.nhanSu, ivCnNua.tongGio)}</td>
                  <td className={bcncTdQuyDoi}>{formatNumberVN(ivQuyDoi)}</td>
                  <td className={bcncTdTongGio}>{formatNumberVN(ivTongGioNgayNua)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatNumberVN(ivTangCa.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary`}>{formatGioTbVN(ivTangCa.nhanSu, ivTangCa.tongGio)}</td>
                  <td className={bcncTdTongGioTc}>{formatNumberVN(ivTongGioTc)}</td>
                  <td className={`${bcncTdGhiChu} text-muted-foreground text-sm font-normal`}>—</td>
                </tr>
                <BaoCaoNhanCongDetailChuyenRow row={vRow} tt="V" />
                <tr className="border-b border-border/80 bg-primary/15 dark:bg-primary/20 last:border-0 font-semibold">
                  <td className={`${bcncTdChuyen} text-left text-primary sm:pl-3 tracking-tight`} colSpan={2}>
                    {t('baoCaoNhanCong.form.rowTongNgay')}
                  </td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongCnNgay.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongCnNgay.nhanSu, tongCnNgay.tongGio)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongCnNua.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongCnNua.nhanSu, tongCnNua.tongGio)}</td>
                  <td className={`${bcncTdQuyDoi} text-base bg-primary/[0.1] dark:bg-primary/20`}>{formatNumberVN(tongQuyDoiPhieu)}</td>
                  <td className={`${bcncTdTongGio} text-base`}>{formatNumberVN(tongTongGioNgayNua)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatNumberVN(tongTangCa.nhanSu)}</td>
                  <td className={`${bcncTdMainNum} text-primary text-base`}>{formatGioTbVN(tongTangCa.nhanSu, tongTangCa.tongGio)}</td>
                  <td className={`${bcncTdTongGioTc} text-base`}>{formatNumberVN(tongTongGioTc)}</td>
                  <td className={`${bcncTdGhiChu} text-muted-foreground text-sm font-normal`}>—</td>
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
