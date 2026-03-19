import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Trash2, FileText, Calendar, Building2, Warehouse, User, UserCheck, Package, CreditCard, CheckCircle, Printer, X, RefreshCw } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import Combobox from '../../../../components/ui/Combobox';
import type { DonDatHang, DonDatHangTrangThai } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_XAC_NHAN, TRANG_THAI_HUY } from '../core/types';
import { TRANG_THAI_KEY, TRANG_THAI_DON_DAT_HANG } from '../core/constants';
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

/** Kết quả phê duyệt: text như DB (giống đề xuất vật tư). */
export interface DonDatHangApprovePayload {
  trangThai: typeof TRANG_THAI_DA_XAC_NHAN | typeof TRANG_THAI_HUY;
  ghiChu?: string;
}

/** Payload khi chuyển trạng thái từ popup (chọn trạng thái bất kỳ + ghi chú). */
export interface DonDatHangChangeStatusPayload {
  trangThai: DonDatHangTrangThai;
  ghiChu?: string;
}

interface Props {
  data: DonDatHang;
  onClose: () => void;
  onEdit?: (item: DonDatHang) => void;
  onDelete?: (id: string) => void;
  onApprove?: (item: DonDatHang, payload: DonDatHangApprovePayload) => void;
  /** Gọi khi bấm Chuyển trạng thái và xác nhận trong popup */
  onChangeStatus?: (item: DonDatHang, payload: DonDatHangChangeStatusPayload) => void;
  onPrint?: (item: DonDatHang) => void;
}

const STATUS_VARIANTS: Record<string, string> = {
  'Nháp': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  'Chờ duyệt': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Đã gửi': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Đã xác nhận': 'bg-primary/10 text-primary border-primary/20',
  'Đang giao': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  'Đã nhận đủ': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Đã đóng': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Hủy': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const DonDatHangDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onApprove, onChangeStatus, onPrint }) => {
  const { t } = useTranslation();
  const canApprove = data.trang_thai === TRANG_THAI_CHO_DUYET && !!onApprove;
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [approveGhiChu, setApproveGhiChu] = useState('');
  const [showChangeStatusPopup, setShowChangeStatusPopup] = useState(false);
  const [changeStatusTrangThai, setChangeStatusTrangThai] = useState<DonDatHangTrangThai>(data.trang_thai);
  const [changeStatusGhiChu, setChangeStatusGhiChu] = useState('');

  const statusOptions = useMemo(
    () =>
      TRANG_THAI_DON_DAT_HANG.map((s) => ({
        value: s,
        label: t(`donDatHang.status.${TRANG_THAI_KEY[s] ?? 'draft'}`),
      })),
    [t]
  );

  const submitApprove = (trangThai: typeof TRANG_THAI_DA_XAC_NHAN | typeof TRANG_THAI_HUY) => {
    onApprove?.(data, { trangThai, ghiChu: approveGhiChu.trim() || undefined });
    setShowApprovePopup(false);
    setApproveGhiChu('');
  };

  const handleChangeStatusConfirm = () => {
    onChangeStatus?.(data, {
      trangThai: changeStatusTrangThai,
      ghiChu: changeStatusGhiChu.trim() || undefined,
    });
    setShowChangeStatusPopup(false);
  };

  const showChangeStatusButton = !!onChangeStatus;

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () => [
      ...(showChangeStatusButton
        ? [
            {
              label: t('donDatHang.detail.toolbar.changeStatus'),
              icon: <RefreshCw size={16} />,
              onClick: () => {
                setChangeStatusTrangThai(data.trang_thai);
                setChangeStatusGhiChu('');
                setShowChangeStatusPopup(true);
              },
              variant: 'primary' as const,
            },
          ]
        : []),
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
    [showChangeStatusButton, canApprove, data, onApprove, onChangeStatus, onPrint, t]
  );

  const statusLabel = t(`donDatHang.status.${TRANG_THAI_KEY[data.trang_thai as keyof typeof TRANG_THAI_KEY] ?? 'draft'}`);
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
        {onEdit && (
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
        {onDelete && (
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

      {/* Popup phê duyệt: hai nút Duyệt / Không duyệt + ghi chú (giống module đề xuất vật tư) */}
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
              className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('donDatHang.detail.approveDialogTitle')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowApprovePopup(false)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label={t('common.close')}
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{data.so_po}</p>
              </div>
              <div className="px-6 py-4 flex items-center justify-center gap-3">
                <Button
                  onClick={() => submitApprove(TRANG_THAI_HUY)}
                  className="bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-sm"
                >
                  <X size={16} className="mr-2" />
                  {t('donDatHang.detail.approveReject')}
                </Button>
                <Button
                  onClick={() => submitApprove(TRANG_THAI_DA_XAC_NHAN)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 shadow-sm"
                >
                  <CheckCircle size={16} className="mr-2" />
                  {t('donDatHang.detail.approveApprove')}
                </Button>
              </div>
              <div className="px-6 pb-4">
                <Textarea
                  label={t('donDatHang.detail.approveDialogNote')}
                  placeholder={t('donDatHang.detail.approveDialogNotePlaceholder')}
                  value={approveGhiChu}
                  onChange={(e) => setApproveGhiChu(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="px-6 pb-6 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setShowApprovePopup(false)}
                  className="border border-border text-muted-foreground"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Popup Chuyển trạng thái */}
        {showChangeStatusPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowChangeStatusPopup(false)}
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
                  {t('donDatHang.detail.changeStatusTitle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowChangeStatusPopup(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <Combobox
                  label={t('donDatHang.form.status')}
                  options={statusOptions}
                  value={changeStatusTrangThai}
                  onChange={(v) => setChangeStatusTrangThai(v as DonDatHangTrangThai)}
                  placeholder={t('donDatHang.detail.changeStatusSelectStatus')}
                />
                <Textarea
                  label={t('donDatHang.detail.changeStatusDialogNote')}
                  placeholder={t('donDatHang.detail.approveDialogNotePlaceholder')}
                  value={changeStatusGhiChu}
                  onChange={(e) => setChangeStatusGhiChu(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="ghost" onClick={() => setShowChangeStatusPopup(false)} className="border border-border">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleChangeStatusConfirm} className="bg-primary text-white">
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
