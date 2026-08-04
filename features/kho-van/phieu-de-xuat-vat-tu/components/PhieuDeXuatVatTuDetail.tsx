import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Calendar, Warehouse, User, UserCheck, Package, CheckCircle, Printer, X, Copy, ShoppingCart, Hourglass } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import Textarea from '../../../../components/ui/Textarea';
import type { PhieuDeXuatVatTu } from '../core/types';
import type { TrangThaiPhieuDeXuatVatTu } from '../core/constants';
import {
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_KHONG_DUYET,
  getTrangThaiPhieuBadgeClass,
  isTrangThaiChoPheDuyet,
  trangThaiToI18nKey,
} from '../core/constants';
import { cn, formatDateTimeShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';

const PREVIEW_BASE = '/mua-hang/phieu-de-xuat-vat-tu/preview';

interface ApproveOptionProps {
  label: string;
  icon: React.ReactNode;
  iconWrapClass: string;
  buttonClass: string;
  onClick: () => void;
  className?: string;
}

const ApproveOption: React.FC<ApproveOptionProps> = ({
  label,
  icon,
  iconWrapClass,
  buttonClass,
  onClick,
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'group flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'hover:shadow-sm active:scale-[0.98]',
      buttonClass,
      className,
    )}
  >
    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', iconWrapClass)}>
      {icon}
    </span>
    <span className="text-xs font-medium leading-tight">{label}</span>
  </button>
);

export interface PhieuDeXuatVatTuApprovePayload {
  trangThai: TrangThaiPhieuDeXuatVatTu;
  ghiChu?: string;
}

interface Props {
  data: PhieuDeXuatVatTu;
  onClose: () => void;
  onEdit?: (item: PhieuDeXuatVatTu) => void;
  onDelete?: (id: string) => void;
  onCopy?: (item: PhieuDeXuatVatTu) => void;
  onApprove?: (item: PhieuDeXuatVatTu, payload: PhieuDeXuatVatTuApprovePayload) => void;
  onPrint?: (item: PhieuDeXuatVatTu) => void;
  onCreateDonDatHang?: (item: PhieuDeXuatVatTu) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  showOverdueBadge?: boolean;
}

const PhieuDeXuatVatTuDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onCopy,
  onApprove,
  onPrint,
  onCreateDonDatHang,
  canEdit = true,
  canDelete = true,
  showOverdueBadge = false,
}) => {
  const { t } = useTranslation();
  const canApprove = isTrangThaiChoPheDuyet(data.trang_thai) && !!onApprove;
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [approveGhiChu, setApproveGhiChu] = useState('');

  const submitApprove = (trangThai: TrangThaiPhieuDeXuatVatTu) => {
    onApprove?.(data, { trangThai, ghiChu: approveGhiChu.trim() || undefined });
    setShowApprovePopup(false);
    setApproveGhiChu('');
  };

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () => [
      ...(canApprove
        ? [
            {
              label: t('phieuDeXuatVatTu.detail.toolbar.approve'),
              icon: <CheckCircle size={16} />,
              onClick: () => setShowApprovePopup(true),
              variant: 'success' as const,
            },
          ]
        : []),
      ...(onCopy
        ? [
            {
              label: t('phieuDeXuatVatTu.detail.toolbar.copy'),
              icon: <Copy size={16} />,
              onClick: () => { onCopy(data); onClose(); },
            },
          ]
        : []),
      ...(onCreateDonDatHang
        ? [
            {
              label: t('phieuDeXuatVatTu.detail.toolbar.createOrder'),
              icon: <ShoppingCart size={16} />,
              onClick: () => onCreateDonDatHang(data),
            },
          ]
        : []),
      {
        label: t('phieuDeXuatVatTu.detail.toolbar.print'),
        icon: <Printer size={16} />,
        onClick: () => {
          if (onPrint) onPrint(data);
          else window.open(`${PREVIEW_BASE}/${data.id}`, '_blank', 'noopener,noreferrer');
        },
        variant: 'primary' as const,
      },
    ],
    [canApprove, data, onApprove, onCopy, onClose, onPrint, onCreateDonDatHang, t]
  );

  const statusLabel = t(`phieuDeXuatVatTu.status.${trangThaiToI18nKey(data.trang_thai)}`);

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      canUpdate={canEdit}
      canDelete={canDelete}
      onEdit={() => { onEdit?.(data); onClose(); }}
      onDelete={() => { onDelete?.(data.id); onClose(); }}
    />
  );

  return (
    <>
    <GenericDrawer
      title={t('phieuDeXuatVatTu.detail.title')}
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
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                  getTrangThaiPhieuBadgeClass(data.trang_thai),
                )}
              >
                {statusLabel}
              </span>
              {showOverdueBadge && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                  {t('phieuDeXuatVatTu.overdueWarning')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('phieuDeXuatVatTu.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('phieuDeXuatVatTu.form.code')} value={data.so_phieu} icon={<FileText size={12} />} />
            <DetailField label={t('phieuDeXuatVatTu.form.date')} value={data.ngay} icon={<Calendar size={12} />} />
            <DetailField
              label={t('phieuDeXuatVatTu.form.requiredDate')}
              value={data.ngay_can}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.place')}
              value={data.ten_noi_de_xuat ?? '—'}
              icon={<Warehouse size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.requester')}
              value={data.ten_nguoi_de_xuat ?? '—'}
              icon={<User size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.approver')}
              value={data.ten_nguoi_duyet ?? '—'}
              icon={<UserCheck size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.form.notes')}
              value={data.ghi_chu ?? '—'}
              icon={<FileText size={12} />}
              className="col-span-1 sm:col-span-2"
            />
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('phieuDeXuatVatTu.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={data.chi_tiet?.length ?? 0}
          emptyTitle={t('phieuDeXuatVatTu.form.noItems')}
          emptyDescription={t('phieuDeXuatVatTu.form.noItemsHint')}
          maxTableHeight="320px"
        >
          {data.chi_tiet && data.chi_tiet.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[130px]">
                    {t('phieuDeXuatVatTu.form.itemCode')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[300px]">
                    {t('phieuDeXuatVatTu.form.itemName')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[90px]">
                    {t('phieuDeXuatVatTu.form.unit')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[110px]">
                    {t('phieuDeXuatVatTu.form.quantity')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[220px]">
                    {t('phieuDeXuatVatTu.form.specs')}
                  </th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[220px]">
                    {t('phieuDeXuatVatTu.form.note')}
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {data.chi_tiet.map((ct, idx) => (
                  <tr key={ct.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{ct.ma_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm whitespace-nowrap">{ct.ten_hang ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{ct.don_vi_tinh ?? '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">{ct.so_luong}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{ct.thong_so ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{ct.ghi_chu ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        <DetailSection title={t('phieuDeXuatVatTu.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField
              label={t('phieuDeXuatVatTu.detail.createdAt')}
              value={formatDateTimeShort(data.tg_tao)}
              icon={<Calendar size={12} />}
            />
            <DetailField
              label={t('phieuDeXuatVatTu.detail.updatedAt')}
              value={formatDateTimeShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>

      {/* Popup phê duyệt: Không duyệt / Đợi duyệt / Đã duyệt + ghi chú */}
      <AnimatePresence>
        {showApprovePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowApprovePopup(false)}
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
                      {t('phieuDeXuatVatTu.detail.approveDialogTitle')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{data.so_phieu}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowApprovePopup(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                    aria-label={t('common.close')}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {t('phieuDeXuatVatTu.detail.approveDialogResult')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <ApproveOption
                      label={t('phieuDeXuatVatTu.status.approved')}
                      icon={<CheckCircle size={14} />}
                      iconWrapClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      buttonClass="border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-800 dark:text-emerald-200 hover:border-emerald-500/45 hover:bg-emerald-500/10"
                      onClick={() => submitApprove(TRANG_THAI_DA_DUYET)}
                    />
                    <ApproveOption
                      label={t('phieuDeXuatVatTu.status.waiting')}
                      icon={<Hourglass size={14} />}
                      iconWrapClass="bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      buttonClass="border-sky-500/25 bg-sky-500/[0.04] text-sky-800 dark:text-sky-200 hover:border-sky-500/45 hover:bg-sky-500/10"
                      onClick={() => submitApprove(TRANG_THAI_DOI_DUYET)}
                    />
                    <ApproveOption
                      label={t('phieuDeXuatVatTu.status.rejected')}
                      icon={<X size={14} />}
                      iconWrapClass="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      buttonClass="border-rose-500/25 bg-rose-500/[0.04] text-rose-800 dark:text-rose-200 hover:border-rose-500/45 hover:bg-rose-500/10"
                      onClick={() => submitApprove(TRANG_THAI_KHONG_DUYET)}
                    />
                  </div>
                </div>

                <Textarea
                  label={t('phieuDeXuatVatTu.detail.approveDialogNote')}
                  placeholder={t('phieuDeXuatVatTu.detail.approveDialogNotePlaceholder')}
                  value={approveGhiChu}
                  onChange={(e) => setApproveGhiChu(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowApprovePopup(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhieuDeXuatVatTuDetail;
