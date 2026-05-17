import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Edit, Layers, Lock, MessageSquare, Trash2, Unlock, Users, Calculator, Package } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmBaoCaoSoChe } from '../core/types';
import { TRANG_THAI_BAO_CAO_SO_CHE } from '../core/types';
import { cn, formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useCopyBaoCaoSoCheToNextDay, useUpdateBaoCaoSoCheTrangThai } from '../hooks/use-bao-cao-so-che';
import { useBaoCaoNhanCongList } from '../../bao-cao-nhan-cong/hooks/use-bao-cao-nhan-cong';
import BaoCaoSoCheBcncKpiReadout from './BaoCaoSoCheBcncKpiReadout';
import BaoCaoKpiThuongDetailSection from '../../shared/kpi-thuong/BaoCaoKpiThuongDetailSection';
import { BaoCaoSoChePhamCapDetailTable } from './BaoCaoSoChePhamCapTables';
import {
  BCSC_KPI_STT_OFFSET,
  BCSC_SO_LIEU_STT_OFFSET,
  deriveDonViTinhSlipFromSoLieuMeta,
  mergeSoLieuMetaToForm,
  SO_LIEU_BUONG_ROW_DEFS,
  SO_LIEU_ROW_DVT_DEFAULT,
} from '../core/so-lieu-row-meta';

interface Props {
  data: FarmBaoCaoSoChe;
  existingList: FarmBaoCaoSoChe[];
  onClose: () => void;
  onEdit?: (item: FarmBaoCaoSoChe) => void;
  onDelete?: (id: string) => void;
  onAfterCopyToNextDay?: (newItem: FarmBaoCaoSoChe) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canCopyNextDay?: boolean;
  canToggleTrangThai?: boolean;
}

const BaoCaoSoCheDetail: React.FC<Props> = ({
  data,
  existingList,
  onClose,
  onEdit,
  onDelete,
  onAfterCopyToNextDay,
  canUpdate = true,
  canDelete = true,
  canCopyNextDay = true,
  canToggleTrangThai = false,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const copyMutation = useCopyBaoCaoSoCheToNextDay();
  const trangThaiMutation = useUpdateBaoCaoSoCheTrangThai();
  const { data: bcncList = [] } = useBaoCaoNhanCongList();

  const soLieuMetaForm = useMemo(() => mergeSoLieuMetaToForm(data.so_lieu_row_meta), [data.so_lieu_row_meta]);
  const donViTinhKpi = useMemo(() => deriveDonViTinhSlipFromSoLieuMeta(soLieuMetaForm), [soLieuMetaForm]);

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
  if (canCopyNextDay) {
    toolbarActions.push({
      label: t('baoCaoSoChe.detail.copyNextDay'),
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
    const locked = data.trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA;
    toolbarActions.push({
      label: locked ? t('baoCaoSoChe.detail.toggleUnlock') : t('baoCaoSoChe.detail.toggleLock'),
      icon: locked ? <Unlock size={16} /> : <Lock size={16} />,
      variant: 'outline',
      disabled: trangThaiMutation.isPending || copyMutation.isPending,
      onClick: () => {
        if (locked) {
          confirm({
            title: t('baoCaoSoChe.confirmUnlockTitle'),
            message: t('baoCaoSoChe.confirmUnlockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_BAO_CAO_SO_CHE.MO,
              });
            },
          });
        } else {
          confirm({
            title: t('baoCaoSoChe.confirmLockTitle'),
            message: t('baoCaoSoChe.confirmLockMessage'),
            variant: 'warning',
            confirmText: CONFIRM_YES(),
            onConfirm: () => {
              trangThaiMutation.mutate({
                id: data.id,
                trang_thai: TRANG_THAI_BAO_CAO_SO_CHE.KHOA,
              });
            },
          });
        }
      },
    });
  }

  return (
    <GenericDrawer
      title={t('baoCaoSoChe.detail.title')}
      subtitle={formatDateShort(data.ngay)}
      icon={<Layers className="text-emerald-600" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={renderFooter}
    >
      <div className="space-y-4 pb-2">
        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}
        <DetailSection title={t('baoCaoSoChe.detail.sectionOverview')} icon={<Layers size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('baoCaoSoChe.form.ngay')} value={formatDateShort(data.ngay)} />
            <DetailField label={t('baoCaoSoChe.form.branch')} value={data.ten_chi_nhanh ?? '—'} />
            <DetailField
              label={t('baoCaoSoChe.store.colTrangThai')}
              value={
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
                    data.trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100'
                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
                  )}
                >
                  {data.trang_thai === TRANG_THAI_BAO_CAO_SO_CHE.KHOA
                    ? t('baoCaoSoChe.trangThai.khoa')
                    : t('baoCaoSoChe.trangThai.mo')}
                </span>
              }
            />
            <DetailField label={t('baoCaoSoChe.store.colNguoiTao')} value={data.ten_nguoi_tao ?? '—'} />
            <DetailField label={t('baoCaoSoChe.store.colTgTao')} value={formatDateTimeShort(data.tg_tao)} />
            <DetailField label={t('baoCaoSoChe.store.colUpdated')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('baoCaoSoChe.form.ghiChuPhieu')} icon={<MessageSquare size={14} />} variant="primary">
          {data.ghi_chu?.trim() ? (
            <div className="whitespace-pre-wrap text-body-sm text-foreground leading-relaxed">{data.ghi_chu}</div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </DetailSection>

        <DetailSection title={t('baoCaoSoChe.form.sectionBcncTitle')} icon={<Users size={14} />} variant="primary">
          <BaoCaoSoCheBcncKpiReadout
            variant="bcnc"
            ngay={data.ngay}
            idChiNhanh={data.id_chi_nhanh != null ? String(data.id_chi_nhanh) : ''}
            tongBuongSoChe={Number(data.tong_buong_so_che)}
            bcncList={bcncList}
            donViTinh={donViTinhKpi}
          />
        </DetailSection>

        <DetailSection title={t('baoCaoSoChe.form.sectionSoCheTitle')} icon={<Layers size={14} />} variant="primary">
          <div className="overflow-x-auto rounded-lg border border-border bg-muted/10">
            <table className="w-full text-sm min-w-[48rem] text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-center px-2 py-2 font-medium text-xs w-14 whitespace-nowrap">{t('baoCaoSoChe.readout.colTt')}</th>
                  <th className="text-left px-3 py-2 font-medium text-xs min-w-[10rem]">{t('baoCaoSoChe.readout.colChiSo')}</th>
                  <th className="text-right px-2 py-2 font-medium text-xs min-w-[7.5rem]">{t('baoCaoSoChe.readout.colGiaTri')}</th>
                  <th className="text-left px-2 py-2 font-medium text-xs w-[7.5rem] whitespace-nowrap">{t('baoCaoSoChe.readout.colDvtDong')}</th>
                  <th className="text-left px-2 py-2 font-medium text-xs min-w-[18rem] w-[22rem]">{t('baoCaoSoChe.readout.colGhiChu')}</th>
                </tr>
              </thead>
              <tbody>
                {SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
                  const val = data[def.key] as number;
                  const meta = soLieuMetaForm[def.key];
                  const dvtDong = meta.don_vi_tinh_phu?.trim() || SO_LIEU_ROW_DVT_DEFAULT;
                  const ghi = meta.ghi_chu?.trim();
                  return (
                    <tr key={def.key} className="border-b border-border/80 last:border-b-0">
                      <td className="px-2 py-2 text-center font-medium text-muted-foreground tabular-nums text-xs align-top">
                        {BCSC_SO_LIEU_STT_OFFSET + idx + 1}
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground text-xs whitespace-normal">{t(def.labelKey)}</td>
                      <td className="px-2 py-2 text-xs font-medium tabular-nums text-right align-top">{formatNumberVN(val)}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground align-top whitespace-nowrap">{dvtDong}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground whitespace-pre-wrap align-top min-w-[18rem] max-w-[32rem]">
                        {ghi ? ghi : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DetailSection>

        <DetailSection title={t('baoCaoSoChe.form.sectionNsLuongTitle')} icon={<Calculator size={14} />} variant="primary">
          <BaoCaoSoCheBcncKpiReadout
            variant="kpi"
            ngay={data.ngay}
            idChiNhanh={data.id_chi_nhanh != null ? String(data.id_chi_nhanh) : ''}
            tongBuongSoChe={Number(data.tong_buong_so_che)}
            bcncList={bcncList}
            donViTinh={donViTinhKpi}
            sttOffset={BCSC_KPI_STT_OFFSET}
          />
        </DetailSection>

        <BaoCaoKpiThuongDetailSection rows={data.kpi_thuong ?? []} i18nPrefix="baoCaoSoChe.kpiThuong" />

        <DetailSection title={t('baoCaoSoChe.form.sectionPhamCapTitle')} icon={<Package size={14} />} variant="primary">
          <BaoCaoSoChePhamCapDetailTable rows={data.pham_cap} />
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default BaoCaoSoCheDetail;
