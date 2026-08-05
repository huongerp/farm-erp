import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Calendar, Warehouse, ArrowRightLeft, Package, Truck, Printer, CheckCircle, X, Copy, Hourglass, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';
import { cn } from '../../../../lib/utils';
import type { PhieuKho, LoaiPhieuKhoTab, TrangThaiPhieuKho } from '../core/types';
import {
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_KHONG_DUYET,
  getTrangThaiPhieuBadgeClass,
  isTrangThaiDaQuyetDinh,
  trangThaiToI18nKey,
} from '../core/constants';
import { formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_PHIEU_KHO } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useUpdatePhieuKhoTrangThai } from '../hooks/use-phieu-kho';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';

interface ApproveOptionProps {
  label: string;
  icon: React.ReactNode;
  iconWrapClass: string;
  buttonClass: string;
  onClick: () => void;
  disabled?: boolean;
}

const ApproveOption: React.FC<ApproveOptionProps> = ({
  label,
  icon,
  iconWrapClass,
  buttonClass,
  onClick,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'group flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'hover:shadow-sm active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
      buttonClass,
    )}
  >
    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', iconWrapClass)}>
      {icon}
    </span>
    <span className="text-xs font-medium leading-tight">{label}</span>
  </button>
);

interface Props {
  data: PhieuKho;
  loai: LoaiPhieuKhoTab;
  onClose: () => void;
  onEdit?: (item: PhieuKho) => void;
  onDelete?: (id: string) => void;
  onCopy?: (item: PhieuKho) => void;
  /** Có quyền phê duyệt – ẩn nút Duyệt khi false */
  canApprove?: boolean;
}

const PhieuKhoDetail: React.FC<Props> = ({ data, loai, onClose, onEdit, onDelete, onCopy, canApprove = true }) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const confirm = useConfirmStore((s) => s.confirm);
  const nguoiDuyetId = user?.id != null ? Number(user.id) : null;
  const nguoiDuyetIdValid = nguoiDuyetId != null && !Number.isNaN(nguoiDuyetId) ? nguoiDuyetId : null;
  const nguoiDuyetTen =
    user?.ho_va_ten?.trim() || user?.full_name?.trim() || user?.email?.trim() || '';
  const [showDuyetPopup, setShowDuyetPopup] = useState(false);
  const [duyetGhiChu, setDuyetGhiChu] = useState('');
  const updateTrangThaiMutation = useUpdatePhieuKhoTrangThai(() => setShowDuyetPopup(false));

  const showApproveButton = canApprove;
  const isDaQuyetDinh = isTrangThaiDaQuyetDinh(data.trang_thai);
  const statusLabel = t(`phieuKho.status.${trangThaiToI18nKey(data.trang_thai)}`);

  const applyTrangThai = (trangThai: TrangThaiPhieuKho) => {
    updateTrangThaiMutation.mutate(
      {
        id: data.id,
        trang_thai: trangThai,
        ghi_chu: duyetGhiChu.trim() || undefined,
        id_nguoi_duyet: nguoiDuyetIdValid,
        ten_nguoi_duyet_hien_thi: nguoiDuyetTen || undefined,
      },
      {
        onSuccess: () => {
          setShowDuyetPopup(false);
          setDuyetGhiChu('');
        },
      },
    );
  };

  const submitApprove = (trangThai: TrangThaiPhieuKho) => {
    if (trangThai === data.trang_thai) {
      toast.message(t('phieuKho.approveDialog.sameStatus'));
      return;
    }
    if (isDaQuyetDinh) {
      if (!duyetGhiChu.trim()) {
        toast.warning(t('phieuKho.approveDialog.noteRequired'));
        return;
      }
      const toLabel = t(`phieuKho.status.${trangThaiToI18nKey(trangThai)}`);
      confirm({
        title: t('phieuKho.approveDialog.redecideConfirmTitle'),
        message: t('phieuKho.approveDialog.redecideConfirmMessage', {
          from: statusLabel,
          to: toLabel,
        }),
        variant: 'warning',
        confirmText: CONFIRM_YES(),
        onConfirm: () => applyTrangThai(trangThai),
      });
      return;
    }
    applyTrangThai(trangThai);
  };

  const isChuyen = loai === 'chuyen';
  const isNhap = loai === 'nhap';
  const isXuat = loai === 'xuat';

  const detailToolbarActions: DetailToolbarAction[] = useMemo(() => {
    const actions: DetailToolbarAction[] = [];
    if (showApproveButton) {
      actions.push({
        label: isDaQuyetDinh ? t('phieuKho.approveActionChange') : t('phieuKho.approveAction'),
        icon: <CheckCircle size={16} />,
        onClick: () => {
          setDuyetGhiChu('');
          setShowDuyetPopup(true);
        },
        variant: 'primary',
      });
    }
    if (onCopy) {
      actions.push({
        label: t('phieuKho.copyAction'),
        icon: <Copy size={16} />,
        onClick: () => { onCopy(data); onClose(); },
      });
    }
    actions.push({
      label: t('phieuKho.printAction'),
      icon: <Printer size={16} />,
      onClick: () => window.open(`/mua-hang/phieu-kho/preview/${data.id}`, '_blank', 'noopener,noreferrer'),
    });
    return actions;
  }, [data, showApproveButton, isDaQuyetDinh, onCopy, onClose, t]);

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={onEdit ? () => { onEdit(data); onClose(); } : undefined}
      onDelete={onDelete ? () => { onDelete(data.id); onClose(); } : undefined}
    />
  );

  return (
    <>
    <GenericDrawer
      title={t('phieuKho.detail.title')}
      subtitle={data.so_phieu}
      icon={<FileText size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_PHIEU_KHO}
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
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                  getTrangThaiPhieuBadgeClass(data.trang_thai),
                )}
              >
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
            {isNhap && (data.id_don_dat_hang || (data.so_po_don_dat_hang && data.so_po_don_dat_hang.trim() !== '')) && (
              <DetailField
                label={t('phieuKho.detail.linkPo')}
                value={data.so_po_don_dat_hang?.trim() || (data.id_don_dat_hang ? `#${data.id_don_dat_hang}` : '—')}
                icon={<Package size={12} />}
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
            {data.trao_doi && (
              <DetailField
                label={t('phieuKho.detail.traoDoi')}
                value={<span className="whitespace-pre-line break-words">{data.trao_doi}</span>}
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            )}
            <DetailField
              label={t('phieuKho.detail.creator')}
              value={data.ten_nguoi_tao ?? '—'}
              icon={<FileText size={12} />}
            />
            {(data.ten_nguoi_duyet != null && data.ten_nguoi_duyet !== '') || data.id_nguoi_duyet != null ? (
              <DetailField
                label={t('phieuKho.detail.approver')}
                value={data.ten_nguoi_duyet ?? (data.id_nguoi_duyet != null ? `#${data.id_nguoi_duyet}` : '—')}
                icon={<CheckCircle size={12} />}
              />
            ) : null}
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('phieuKho.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={data.chi_tiet?.length ?? 0}
          emptyTitle={t('phieuKho.form.noItems')}
          emptyDescription={t('phieuKho.form.noItemsHint')}
          maxTableHeight="360px"
          tableClassName="min-w-max"
        >
          {data.chi_tiet && data.chi_tiet.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.itemCode')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[140px]">{t('phieuKho.form.itemName')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.phamCap')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-20">{t('phieuKho.form.unit')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-24">{t('phieuKho.form.quantity')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">{t('phieuKho.form.unitPrice')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[100px]">{t('phieuKho.form.amount')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[160px]">{t('phieuKho.preview.soLot')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('phieuKho.form.note')}</th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {data.chi_tiet.map((ct, idx) => (
                  <tr key={ct.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm">{ct.ten_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[120px] truncate" title={ct.pham_cap ?? undefined}>{ct.pham_cap ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.don_vi_tinh ?? '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.so_luong)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.don_gia)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNumberVN(ct.thanh_tien)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground min-w-[160px]">{ct.so_lot ?? '—'}</td>
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

      <AnimatePresence>
        {showDuyetPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDuyetPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t('phieuKho.approveDialog.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{data.so_phieu}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDuyetPopup(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                    aria-label={t('common.close')}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                {isDaQuyetDinh && (
                  <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p>{t('phieuKho.approveDialog.redecideWarning', { status: statusLabel })}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {t('phieuKho.approveDialog.status')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <ApproveOption
                      label={t('phieuKho.status.approved')}
                      icon={<CheckCircle size={14} />}
                      iconWrapClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      buttonClass="border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-800 dark:text-emerald-200 hover:border-emerald-500/45 hover:bg-emerald-500/10"
                      onClick={() => submitApprove(TRANG_THAI_DA_DUYET)}
                      disabled={updateTrangThaiMutation.isPending || data.trang_thai === TRANG_THAI_DA_DUYET}
                    />
                    <ApproveOption
                      label={t('phieuKho.status.waiting')}
                      icon={<Hourglass size={14} />}
                      iconWrapClass="bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      buttonClass="border-sky-500/25 bg-sky-500/[0.04] text-sky-800 dark:text-sky-200 hover:border-sky-500/45 hover:bg-sky-500/10"
                      onClick={() => submitApprove(TRANG_THAI_DOI_DUYET)}
                      disabled={updateTrangThaiMutation.isPending || data.trang_thai === TRANG_THAI_DOI_DUYET}
                    />
                    <ApproveOption
                      label={t('phieuKho.status.rejected')}
                      icon={<X size={14} />}
                      iconWrapClass="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      buttonClass="border-rose-500/25 bg-rose-500/[0.04] text-rose-800 dark:text-rose-200 hover:border-rose-500/45 hover:bg-rose-500/10"
                      onClick={() => submitApprove(TRANG_THAI_KHONG_DUYET)}
                      disabled={updateTrangThaiMutation.isPending || data.trang_thai === TRANG_THAI_KHONG_DUYET}
                    />
                  </div>
                </div>

                <Textarea
                  label={t('phieuKho.approveDialog.note')}
                  placeholder={
                    isDaQuyetDinh
                      ? t('phieuKho.approveDialog.notePlaceholderRequired')
                      : t('phieuKho.approveDialog.notePlaceholder')
                  }
                  value={duyetGhiChu}
                  onChange={(e) => setDuyetGhiChu(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowDuyetPopup(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {BTN_CLOSE()}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhieuKhoDetail;
