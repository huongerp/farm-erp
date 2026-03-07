import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Trash2, FileText, Calendar, Wallet, User, UserCheck, List, CheckCircle, XCircle, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { formatCurrency, formatDateTimeShort, cn } from '../../../../lib/utils';
import type { DeXuatChiPhi } from '../core/types';
import type { ApproveRejectPayload } from '../services/de-xuat-chi-phi-service';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { useEmployees } from '../../../he-thong/nhan-vien/hooks/use-nhan-vien';

function getTongTien(data: DeXuatChiPhi): number {
  if (!data.chi_tiet?.length) return 0;
  return data.chi_tiet.reduce((s, d) => s + (d.so_tien ?? 0), 0);
}

export interface DeXuatChiPhiDetailProps {
  data: DeXuatChiPhi;
  onClose: () => void;
  onEdit: (item: DeXuatChiPhi) => void;
  onDelete: (id: string) => void;
  onApprove?: (id: string, payload: ApproveRejectPayload) => void;
  onReject?: (id: string, payload: ApproveRejectPayload) => void;
}

const DeXuatChiPhiDetail: React.FC<DeXuatChiPhiDetailProps> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) => {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployees();
  const canApprove = data.trang_thai === 0 && !!onApprove;
  const canReject = data.trang_thai === 0 && !!onReject;

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveGhiChu, setApproveGhiChu] = useState('');
  const [rejectLyDo, setRejectLyDo] = useState('');

  const mockApprover = employees[0];

  const handleApproveConfirm = () => {
    if (!mockApprover) return;
    onApprove?.(data.id, {
      id_nguoi_duyet: mockApprover.id,
      ten_nguoi_duyet: mockApprover.ho_ten,
      ghi_chu_duyet: approveGhiChu.trim() || undefined,
    });
    setShowApproveDialog(false);
    setApproveGhiChu('');
  };

  const handleRejectConfirm = () => {
    if (!mockApprover) return;
    onReject?.(data.id, {
      id_nguoi_duyet: mockApprover.id,
      ten_nguoi_duyet: mockApprover.ho_ten,
      ly_do_tu_choi: rejectLyDo.trim() || undefined,
    });
    setShowRejectDialog(false);
    setRejectLyDo('');
  };

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () => [
      ...(canApprove
        ? [
            {
              label: t('deXuatChiPhi.detail.approve'),
              icon: <CheckCircle size={16} />,
              onClick: () => setShowApproveDialog(true),
              variant: 'success' as const,
            },
          ]
        : []),
      ...(canReject
        ? [
            {
              label: t('deXuatChiPhi.detail.reject'),
              icon: <XCircle size={16} />,
              onClick: () => setShowRejectDialog(true),
              variant: 'danger' as const,
            },
          ]
        : []),
    ],
    [canApprove, canReject, t]
  );

  const statusLabel =
    data.trang_thai === 0
      ? t('deXuatChiPhi.status.pending')
      : data.trang_thai === 1
        ? t('deXuatChiPhi.status.approved')
        : t('deXuatChiPhi.status.rejected');
  const statusVariant =
    data.trang_thai === 0 ? 'amber' : data.trang_thai === 1 ? 'primary' : 'rose';

  const tongTien = getTongTien(data);

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
        title={t('deXuatChiPhi.detail.title')}
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
              <h2 className="text-base font-bold text-foreground leading-tight truncate font-mono">{data.so_phieu}</h2>
              <p className="text-body-sm text-muted-foreground mt-0.5">{data.ngay}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums',
                    data.loai === 'thu'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  )}
                >
                  {data.loai === 'thu' ? t('deXuatChiPhi.loaiThu') : t('deXuatChiPhi.loaiChi')}: {formatCurrency(tongTien)}
                </span>
              </div>
            </div>
          </div>

          {toolbarActions.length > 0 && (
            <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
          )}

          <DetailSection title={t('deXuatChiPhi.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
            <DetailFieldGrid>
              <DetailField label={t('deXuatChiPhi.form.code')} value={data.so_phieu} icon={<FileText size={12} />} />
              <DetailField label={t('deXuatChiPhi.form.date')} value={data.ngay} icon={<Calendar size={12} />} />
              <DetailField
                label={t('deXuatChiPhi.form.loai')}
                value={data.loai === 'thu' ? t('deXuatChiPhi.loaiThu') : t('deXuatChiPhi.loaiChi')}
                icon={<FileText size={12} />}
              />
              <DetailField
                label={t('deXuatChiPhi.form.taiKhoan')}
                value={data.ten_tai_khoan ?? '—'}
                icon={<Wallet size={12} />}
              />
              <DetailField
                label={t('deXuatChiPhi.form.requester')}
                value={data.ten_nguoi_de_xuat ?? '—'}
                icon={<User size={12} />}
              />
              <DetailField
                label={t('deXuatChiPhi.form.status')}
                value={statusLabel}
                icon={<UserCheck size={12} />}
              />
              {(data.ten_nguoi_duyet || data.ngay_duyet) && (
                <>
                  <DetailField
                    label={t('deXuatChiPhi.detail.nguoiDuyet')}
                    value={data.ten_nguoi_duyet ?? '—'}
                    icon={<UserCheck size={12} />}
                  />
                  <DetailField
                    label={t('deXuatChiPhi.detail.ngayDuyet')}
                    value={data.ngay_duyet ? formatDateTimeShort(data.ngay_duyet) : '—'}
                    icon={<Calendar size={12} />}
                  />
                </>
              )}
              {data.ly_do_tu_choi && (
                <DetailField
                  label={t('deXuatChiPhi.detail.lyDoTuChoi')}
                  value={data.ly_do_tu_choi}
                  icon={<FileText size={12} />}
                  className="col-span-1 sm:col-span-2"
                />
              )}
              <DetailField
                label={t('deXuatChiPhi.form.notes')}
                value={data.ghi_chu ?? '—'}
                icon={<FileText size={12} />}
                className="col-span-1 sm:col-span-2"
              />
            </DetailFieldGrid>
          </DetailSection>

          <GenericSubTableSection
            title={t('deXuatChiPhi.form.detailSection')}
            icon={<List size={14} className="text-primary" />}
            count={data.chi_tiet?.length ?? 0}
            emptyTitle={t('deXuatChiPhi.form.noItems')}
            maxTableHeight="320px"
          >
            {data.chi_tiet && data.chi_tiet.length > 0 && (
              <>
                <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap w-10">#</th>
                    <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[200px]">
                      {t('deXuatChiPhi.form.danhMuc')}
                    </th>
                    <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[120px]">
                      {t('deXuatChiPhi.form.soTien')}
                    </th>
                    <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-[160px]">
                      {t('deXuatChiPhi.form.noiDung')}
                    </th>
                  </tr>
                </thead>
                <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                  {data.chi_tiet.map((ct, idx) => (
                    <tr key={ct.id} className="hover:bg-muted/60 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-2.5 text-sm">{ct.ten_danh_muc ?? '—'}</td>
                      <td className="px-4 py-2.5 tabular-nums font-medium">
                        <span className={data.loai === 'thu' ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatCurrency(ct.so_tien)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{ct.noi_dung ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </GenericSubTableSection>

          <DetailSection title={t('deXuatChiPhi.detail.systemInfo')} icon={<Calendar size={14} />} variant="secondary">
            <DetailFieldGrid>
              <DetailField
                label={t('deXuatChiPhi.detail.createdAt')}
                value={formatDateTimeShort(data.tg_tao)}
                icon={<Calendar size={12} />}
              />
              <DetailField
                label={t('deXuatChiPhi.detail.updatedAt')}
                value={formatDateTimeShort(data.tg_cap_nhat)}
                icon={<Calendar size={12} />}
              />
            </DetailFieldGrid>
          </DetailSection>
        </div>
      </GenericDrawer>

      <AnimatePresence>
        {showApproveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowApproveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">{t('deXuatChiPhi.detail.approveDialogTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setShowApproveDialog(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
              <Textarea
                label={t('deXuatChiPhi.detail.approveDialogNote')}
                placeholder={t('deXuatChiPhi.detail.approveDialogNotePlaceholder')}
                value={approveGhiChu}
                onChange={(e) => setApproveGhiChu(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="ghost" onClick={() => setShowApproveDialog(false)} className="border border-border">
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

      <AnimatePresence>
        {showRejectDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowRejectDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">{t('deXuatChiPhi.detail.rejectDialogTitle')}</h3>
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('common.close')}
                >
                  <X size={18} />
                </button>
              </div>
              <Textarea
                label={t('deXuatChiPhi.detail.rejectDialogReason')}
                placeholder={t('deXuatChiPhi.detail.rejectDialogReasonPlaceholder')}
                value={rejectLyDo}
                onChange={(e) => setRejectLyDo(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2 mt-5">
                <Button variant="ghost" onClick={() => setShowRejectDialog(false)} className="border border-border">
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleRejectConfirm}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  {t('deXuatChiPhi.detail.reject')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DeXuatChiPhiDetail;
