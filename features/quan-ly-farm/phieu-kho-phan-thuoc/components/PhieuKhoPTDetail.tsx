import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, Warehouse, ArrowRightLeft, Package, Printer, CheckCircle, XCircle, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';
import { cn } from '../../../../lib/utils';
import type { PhieuKhoPT, LoaiPhieuKhoPT, TrangThaiPhieuKhoPT } from '../core/types';
import { formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useUpdatePhieuKhoPTTrangThai } from '../hooks/use-phieu-kho-pt';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';

interface Props {
  data: PhieuKhoPT;
  onClose: () => void;
  onEdit?: (item: PhieuKhoPT) => void;
  onDelete?: (id: string) => void;
  onCopy?: (item: PhieuKhoPT) => void;
  canApprove?: boolean;
}

function loaiLabel(loai: LoaiPhieuKhoPT, t: (k: string) => string): string {
  if (loai === 'nhập') return t('phieuKhoPhanThuoc.tabs.nhap');
  if (loai === 'xuất') return t('phieuKhoPhanThuoc.tabs.xuat');
  return t('phieuKhoPhanThuoc.tabs.chuyen');
}

const PhieuKhoPTDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onCopy, canApprove = true }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const nguoiDuyetId = user?.id != null ? Number(user.id) : null;
  const nguoiDuyetIdValid = nguoiDuyetId != null && !Number.isNaN(nguoiDuyetId) ? nguoiDuyetId : null;
  const nguoiDuyetTen = user?.ho_va_ten?.trim() || user?.full_name?.trim() || user?.email?.trim() || '';
  const [showDuyetPopup, setShowDuyetPopup] = useState(false);
  const [duyetGhiChu, setDuyetGhiChu] = useState('');
  const [duyetOption, setDuyetOption] = useState<'Đã duyệt' | 'Không duyệt'>('Đã duyệt');
  const updateTrangThaiMutation = useUpdatePhieuKhoPTTrangThai(() => setShowDuyetPopup(false));

  const isDaQuyetDinh = data.trang_thai === 'Đã duyệt' || data.trang_thai === 'Không duyệt';
  const statusLabel =
    data.trang_thai === 'Chờ duyệt'
      ? t('phieuKhoPhanThuoc.status.pending')
      : data.trang_thai === 'Đã duyệt'
        ? t('phieuKhoPhanThuoc.status.approved')
        : t('phieuKhoPhanThuoc.status.rejected');
  const statusVariant =
    data.trang_thai === 'Chờ duyệt' ? 'amber' : data.trang_thai === 'Đã duyệt' ? 'primary' : 'rose';
  const isChuyen = data.loai === 'chuyển';
  const isNhap = data.loai === 'nhập';
  const isXuat = data.loai === 'xuất';

  const previewPath = `/quan-ly-farm/phieu-kho-phan-thuoc/preview/${data.id}`;

  const optionLabel = (value: TrangThaiPhieuKhoPT) =>
    value === 'Đã duyệt'
      ? t('phieuKhoPhanThuoc.status.approved')
      : value === 'Không duyệt'
        ? t('phieuKhoPhanThuoc.status.rejected')
        : t('phieuKhoPhanThuoc.status.pending');

  const applyTrangThai = (trangThai: 'Đã duyệt' | 'Không duyệt') => {
    updateTrangThaiMutation.mutate(
      {
        id: data.id,
        trang_thai: trangThai,
        ghi_chu: duyetGhiChu.trim() || undefined,
        id_nguoi_duyet: nguoiDuyetIdValid,
        ten_nguoi_duyet_hien_thi: nguoiDuyetTen || undefined,
      },
      { onSuccess: () => setShowDuyetPopup(false) }
    );
  };

  const submitDuyet = () => {
    if (duyetOption === data.trang_thai) {
      toast.message(t('phieuKhoPhanThuoc.approveDialog.sameStatus'));
      return;
    }
    if (isDaQuyetDinh) {
      if (!duyetGhiChu.trim()) {
        toast.warning(t('phieuKhoPhanThuoc.approveDialog.noteRequired'));
        return;
      }
      confirm({
        title: t('phieuKhoPhanThuoc.approveDialog.redecideConfirmTitle'),
        message: t('phieuKhoPhanThuoc.approveDialog.redecideConfirmMessage', {
          from: statusLabel,
          to: optionLabel(duyetOption),
        }),
        variant: 'warning',
        confirmText: CONFIRM_YES(),
        onConfirm: () => applyTrangThai(duyetOption),
      });
      return;
    }
    applyTrangThai(duyetOption);
  };

  const detailToolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [];
    if (canApprove) {
      actions.push({
        label: isDaQuyetDinh ? t('phieuKhoPhanThuoc.approveActionChange') : t('phieuKhoPhanThuoc.approveAction'),
        icon: <CheckCircle size={16} />,
        onClick: () => {
          setDuyetGhiChu('');
          setDuyetOption(data.trang_thai === 'Không duyệt' ? 'Đã duyệt' : data.trang_thai === 'Đã duyệt' ? 'Không duyệt' : 'Đã duyệt');
          setShowDuyetPopup(true);
        },
        variant: 'primary',
      });
    }
    if (onCopy) {
      actions.push({
        label: t('phieuKhoPhanThuoc.copyAction'),
        icon: <Copy size={16} />,
        onClick: () => {
          onCopy(data);
          onClose();
        },
      });
    }
    actions.push({
      label: t('phieuKhoPhanThuoc.printAction'),
      icon: <Printer size={16} />,
      onClick: () => window.open(previewPath, '_blank', 'noopener,noreferrer'),
    });
    return actions;
  }, [data, canApprove, isDaQuyetDinh, onCopy, onClose, previewPath, t]);

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => { onEdit(data); onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id); onClose(); } : undefined}
    />
  );

  return (
    <GenericDrawer
      title={t('phieuKhoPhanThuoc.detail.title')}
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
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/50 text-foreground border-border">
                {loaiLabel(data.loai, t)}
              </span>
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

        <DetailToolbar actions={detailToolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('phieuKhoPhanThuoc.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('phieuKhoPhanThuoc.form.code')} value={data.so_phieu} icon={<FileText size={12} />} />
            <DetailField label={t('phieuKhoPhanThuoc.form.date')} value={data.ngay} icon={<Calendar size={12} />} />
            <DetailField label={t('phieuKhoPhanThuoc.form.loai')} value={loaiLabel(data.loai, t)} icon={<ArrowRightLeft size={12} />} />
            {isNhap && (
              <DetailField label={t('phieuKhoPhanThuoc.form.warehouseTo')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isXuat && (
              <DetailField label={t('phieuKhoPhanThuoc.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
            )}
            {isChuyen && (
              <>
                <DetailField label={t('phieuKhoPhanThuoc.form.warehouseFrom')} value={data.ten_kho ?? '—'} icon={<Warehouse size={12} />} />
                <DetailField
                  label={t('phieuKhoPhanThuoc.form.warehouseTo')}
                  value={data.ten_kho_den ?? '—'}
                  icon={<ArrowRightLeft size={12} />}
                />
              </>
            )}
            <DetailField
              label={t('phieuKhoPhanThuoc.form.description')}
              value={data.mo_ta ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
            {data.trao_doi && (
              <DetailField
                label={t('phieuKhoPhanThuoc.detail.traoDoi')}
                value={<span className="whitespace-pre-line break-words">{data.trao_doi}</span>}
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            )}
            <DetailField label={t('phieuKhoPhanThuoc.detail.creator')} value={data.ten_nguoi_tao ?? '—'} icon={<FileText size={12} />} />
            {(data.ten_nguoi_duyet != null && data.ten_nguoi_duyet !== '') || data.id_nguoi_duyet != null ? (
              <DetailField
                label={t('phieuKhoPhanThuoc.detail.approver')}
                value={data.ten_nguoi_duyet ?? (data.id_nguoi_duyet != null ? `#${data.id_nguoi_duyet}` : '—')}
                icon={<CheckCircle size={12} />}
              />
            ) : null}
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('phieuKhoPhanThuoc.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={data.chi_tiet?.length ?? 0}
          emptyTitle={t('phieuKhoPhanThuoc.form.noItems')}
          emptyDescription={t('phieuKhoPhanThuoc.form.noItemsHint')}
          maxTableHeight="320px"
        >
          {data.chi_tiet && data.chi_tiet.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">
                    {t('phieuKhoPhanThuoc.form.itemCode')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">
                    {t('phieuKhoPhanThuoc.form.itemName')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-20">
                    {t('phieuKhoPhanThuoc.form.unit')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-24">
                    {t('phieuKhoPhanThuoc.form.quantity')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">
                    {t('phieuKhoPhanThuoc.form.unitPrice')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">
                    {t('phieuKhoPhanThuoc.form.amount')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">
                    {t('phieuKhoPhanThuoc.preview.soLot')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">
                    {t('phieuKhoPhanThuoc.form.note')}
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {data.chi_tiet.map((ct, idx) => (
                  <tr key={ct.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{ct.ten_hang ?? ct.ten_hang_hoa ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.don_vi_tinh ?? '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.so_luong)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.don_gia)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.thanh_tien)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.so_lot ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.ghi_chu ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        <DetailSection title={t('phieuKhoPhanThuoc.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField label={t('phieuKhoPhanThuoc.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('phieuKhoPhanThuoc.detail.updatedAt')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>

      {showDuyetPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDuyetPopup(false)}>
          <div
            className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">{t('phieuKhoPhanThuoc.approveDialog.title')}</h3>

            {isDaQuyetDinh && (
              <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p>{t('phieuKhoPhanThuoc.approveDialog.redecideWarning', { status: statusLabel })}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { value: 'Đã duyệt' as const, icon: <CheckCircle size={15} />, color: 'emerald' },
                  { value: 'Không duyệt' as const, icon: <XCircle size={15} />, color: 'rose' },
                ] as const
              ).map((opt) => {
                const selected = duyetOption === opt.value;
                const label =
                  opt.value === 'Đã duyệt'
                    ? t('phieuKhoPhanThuoc.approveDialog.approveButton')
                    : t('phieuKhoPhanThuoc.approveDialog.rejectButton');
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDuyetOption(opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                      selected &&
                        opt.color === 'emerald' &&
                        'border-emerald-500/60 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-700/50',
                      selected &&
                        opt.color === 'rose' &&
                        'border-rose-500/60 bg-rose-50 text-rose-700 shadow-sm dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-700/50',
                      !selected && 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'shrink-0',
                        selected && opt.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                        selected && opt.color === 'rose' && 'text-rose-600 dark:text-rose-400',
                        !selected && 'text-muted-foreground/60'
                      )}
                    >
                      {opt.icon}
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <Textarea
              label={t('phieuKhoPhanThuoc.approveDialog.note')}
              placeholder={
                isDaQuyetDinh
                  ? t('phieuKhoPhanThuoc.approveDialog.notePlaceholderRequired')
                  : t('phieuKhoPhanThuoc.approveDialog.notePlaceholder')
              }
              value={duyetGhiChu}
              onChange={(e) => setDuyetGhiChu(e.target.value)}
              rows={3}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowDuyetPopup(false)} className="border border-border">
                {BTN_CLOSE()}
              </Button>
              <Button
                onClick={submitDuyet}
                disabled={updateTrangThaiMutation.isPending || duyetOption === data.trang_thai}
                className="bg-primary text-white shadow-lg hover:bg-primary/90"
              >
                {updateTrangThaiMutation.isPending ? '...' : t('phieuKhoPhanThuoc.approveDialog.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </GenericDrawer>
  );
};

export default PhieuKhoPTDetail;
