import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileText, Calendar, Warehouse, ArrowRightLeft, Package, Truck, Printer } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { PhieuKho, LoaiPhieuKho } from '../core/types';
import { formatDateTimeShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: PhieuKho;
  loai: LoaiPhieuKho;
  onClose: () => void;
  onEdit: (item: PhieuKho) => void;
  onDelete: (id: string) => void;
}

const PhieuKhoDetail: React.FC<Props> = ({ data, loai, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const statusLabel =
    data.trang_thai === 0
      ? t('phieuKho.status.pending')
      : data.trang_thai === 1
        ? t('phieuKho.status.approved')
        : t('phieuKho.status.rejected');
  const statusVariant =
    data.trang_thai === 0 ? 'amber' : data.trang_thai === 1 ? 'primary' : 'rose';
  const isChuyen = loai === 'chuyen';
  const isNhap = loai === 'nhap';
  const isXuat = loai === 'xuat';

  const detailToolbarActions: DetailToolbarAction[] = useMemo(
    () => [
      {
        label: t('phieuKho.printAction'),
        icon: <Printer size={16} />,
        onClick: () => window.open(`/kho-van/phieu-kho/preview/${data.id}`, '_blank', 'noopener,noreferrer'),
        variant: 'primary',
      },
    ],
    [data.id, t]
  );

  const renderFooter = (
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
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
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
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('phieuKho.detail.title')}
      subtitle={data.so_phieu}
      icon={<FileText size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.so_phieu}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">{data.ngay}</p>
            <div className="mt-1.5">
              <span
                className={
                  statusVariant === 'amber'
                    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20'
                    : statusVariant === 'primary'
                      ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20'
                      : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20'
                }
              >
                <span
                  className={
                    statusVariant === 'amber'
                      ? 'w-1.5 h-1.5 rounded-full bg-amber-500'
                      : statusVariant === 'primary'
                        ? 'w-1.5 h-1.5 rounded-full bg-primary'
                        : 'w-1.5 h-1.5 rounded-full bg-rose-500'
                  }
                />{' '}
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <DetailToolbar
          actions={detailToolbarActions}
          className="bg-card rounded-xl border border-border"
        />

        <DetailSection title={t('phieuKho.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('phieuKho.form.code')} value={data.so_phieu} icon={<FileText size={12} />} />
            <DetailField label={t('phieuKho.form.date')} value={data.ngay} icon={<Calendar size={12} />} />
            {isNhap && (
              <DetailField label={t('phieuKho.form.warehouseTo')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isXuat && (
              <DetailField label={t('phieuKho.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isChuyen && (
              <>
                <DetailField label={t('phieuKho.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
                <DetailField
                  label={t('phieuKho.form.warehouseTo')}
                  value={data.ten_kho_den ?? '—'}
                  icon={<ArrowRightLeft size={12} />}
                />
              </>
            )}
            {isNhap && data.id_nha_cung_cap && (
              <DetailField
                label={t('phieuKho.detail.supplier')}
                value={data.ten_nha_cung_cap ?? data.id_nha_cung_cap ?? '—'}
                icon={<Truck size={12} />}
              />
            )}
            {isXuat && data.id_khach_hang && (
              <DetailField
                label={t('phieuKho.form.customer')}
                value={data.ten_khach_hang ?? data.id_khach_hang ?? '—'}
                icon={<Truck size={12} />}
              />
            )}
            <DetailField
              label={t('phieuKho.form.description')}
              value={data.mo_ta ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('phieuKho.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={data.chi_tiet?.length ?? 0}
          emptyTitle={t('phieuKho.form.noItems')}
          emptyDescription={t('phieuKho.form.noItemsHint')}
          maxTableHeight="320px"
        >
          {data.chi_tiet && data.chi_tiet.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.itemCode')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('phieuKho.form.itemName')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-20">{t('phieuKho.form.unit')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-24">{t('phieuKho.form.quantity')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('phieuKho.form.note')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {data.chi_tiet.map((ct, idx) => (
                  <tr key={ct.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{ct.ten_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.don_vi_tinh ?? '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{ct.so_luong}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.ghi_chu ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        <DetailSection title={t('phieuKho.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField
              label={t('phieuKho.detail.createdAt')}
              value={formatDateTimeShort(data.tg_tao)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('phieuKho.detail.updatedAt')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default PhieuKhoDetail;
