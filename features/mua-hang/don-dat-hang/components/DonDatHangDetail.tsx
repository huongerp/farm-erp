import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Trash2, FileText, Calendar, Building2, Warehouse, User, UserCheck, Package, CreditCard, CheckCircle, Printer, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import type { DonDatHang, DonDatHangTrangThai } from '../core/types';
import { TRANG_THAI_KEY } from '../core/constants';
import { formatDateTimeShort } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

const PREVIEW_BASE = '/mua-hang/don-dat-hang/preview';

/** 3 = Đã xác nhận, 7 = Hủy */
export interface DonDatHangApprovePayload {
  trangThai: 3 | 7;
  ghiChu?: string;
}

interface Props {
  data: DonDatHang;
  onClose: () => void;
  onEdit: (item: DonDatHang) => void;
  onDelete: (id: string) => void;
  onApprove?: (item: DonDatHang, payload: DonDatHangApprovePayload) => void;
  onPrint?: (item: DonDatHang) => void;
}

const STATUS_VARIANTS: Record<number, string> = {
  0: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  1: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  2: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  3: 'bg-primary/10 text-primary border-primary/20',
  4: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  5: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  6: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  7: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const DonDatHangDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onApprove, onPrint }) => {
  const { t } = useTranslation();
  const canApprove = data.trang_thai === 1 && !!onApprove;
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [approveTrangThai, setApproveTrangThai] = useState<3 | 7>(3);
  const [approveGhiChu, setApproveGhiChu] = useState('');

  const handleApproveConfirm = () => {
    onApprove?.(data, { trangThai: approveTrangThai, ghiChu: approveGhiChu.trim() || undefined });
    setShowApprovePopup(false);
    setApproveGhiChu('');
    setApproveTrangThai(3);
  };

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () => [
      ...(canApprove
        ? [
            {
              label: t('donDatHang.detail.toolbar.approve'),
              icon: <CheckCircle size={16} />,
              onClick: () => setShowApprovePopup(true),
              variant: 'success' as const,
            },
          ]
        : []),
      {
        label: t('donDatHang.detail.toolbar.print'),
        icon: <Printer size={16} />,
        onClick: () => {
          if (onPrint) onPrint(data);
          else window.open(`${PREVIEW_BASE}/${data.id}`, '_blank', 'noopener,noreferrer');
        },
        variant: 'primary' as const,
      },
    ],
    [canApprove, data, onApprove, onPrint, t]
  );

  const statusLabel = t(`donDatHang.status.${TRANG_THAI_KEY[data.trang_thai as keyof typeof TRANG_THAI_KEY]}`);
  const statusClass = STATUS_VARIANTS[data.trang_thai] ?? 'bg-muted text-muted-foreground border-border';

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
    <>
    <GenericDrawer
      title={t('donDatHang.detail.title')}
      subtitle={data.so_po}
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
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.so_po}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">{data.ten_nha_cung_cap ?? '—'}</p>
            <div className="mt-1.5">
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', statusClass)}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('donDatHang.detail.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('donDatHang.form.code')} value={data.so_po} icon={<FileText size={12} />} />
            <DetailField label={t('donDatHang.form.orderDate')} value={data.ngay_dat} icon={<Calendar size={12} />} />
            <DetailField label={t('donDatHang.form.deliveryDate')} value={data.ngay_giao_dk} icon={<Calendar size={12} />} />
            <DetailField label={t('donDatHang.form.supplier')} value={data.ten_nha_cung_cap ?? '—'} icon={<Building2 size={12} />} />
            <DetailField label={t('donDatHang.form.warehouse')} value={data.ten_kho_nhan ?? '—'} icon={<Warehouse size={12} />} />
            <DetailField label={t('donDatHang.form.linkRequest')} value={data.so_phieu_de_xuat ?? '—'} icon={<FileText size={12} />} />
            <DetailField label={t('donDatHang.form.buyer')} value={data.ten_nguoi_dat ?? '—'} icon={<User size={12} />} />
            <DetailField label={t('donDatHang.form.approver')} value={data.ten_nguoi_duyet ?? '—'} icon={<UserCheck size={12} />} />
            <DetailField label={t('donDatHang.form.paymentTerms')} value={data.dieu_khoan_thanh_toan ?? '—'} icon={<CreditCard size={12} />} />
            <DetailField label={t('donDatHang.form.notes')} value={data.ghi_chu ?? '—'} icon={<FileText size={12} />} className="col-span-1 sm:col-span-2" />
          </DetailFieldGrid>
        </DetailSection>

        <GenericSubTableSection
          title={t('donDatHang.form.itemsSection')}
          icon={<Package size={14} className="text-primary" />}
          count={data.chi_tiet?.length ?? 0}
          emptyTitle={t('donDatHang.form.noItems')}
          emptyDescription={t('donDatHang.form.noItemsHint')}
          maxTableHeight="320px"
        >
          {data.chi_tiet && data.chi_tiet.length > 0 && (
            <>
              <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[80px]">{t('donDatHang.form.item')} (mã)</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">{t('donDatHang.form.item')} (tên)</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-16">{t('donDatHang.form.unit')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-20">{t('donDatHang.form.quantity')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-24">{t('donDatHang.form.unitPrice')}</th>
                  <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-28">Thành tiền</th>
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
                    <td className="px-4 py-2.5 tabular-nums text-right">{ct.don_gia != null ? ct.don_gia.toLocaleString() : '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums text-right font-medium">{ct.thanh_tien != null ? ct.thanh_tien.toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </GenericSubTableSection>

        <DetailSection title={t('donDatHang.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
          <DetailFieldGrid>
            <DetailField label={t('donDatHang.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('donDatHang.detail.updatedAt')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>

      <AnimatePresence>
        {showApprovePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowApprovePopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('donDatHang.detail.approveDialogTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowApprovePopup(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('donDatHang.detail.approveDialogResult')}
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="approveResult"
                        checked={approveTrangThai === 3}
                        onChange={() => setApproveTrangThai(3)}
                        className="rounded-full border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{t('donDatHang.status.confirmed')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="approveResult"
                        checked={approveTrangThai === 7}
                        onChange={() => setApproveTrangThai(7)}
                        className="rounded-full border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{t('donDatHang.status.cancelled')}</span>
                    </label>
                  </div>
                </div>
                <Textarea
                  label={t('donDatHang.detail.approveDialogNote')}
                  placeholder={t('donDatHang.detail.approveDialogNotePlaceholder')}
                  value={approveGhiChu}
                  onChange={(e) => setApproveGhiChu(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="ghost" onClick={() => setShowApprovePopup(false)} className="border border-border">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleApproveConfirm} className="bg-primary text-white">
                  {t('common.confirm')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DonDatHangDetail;
