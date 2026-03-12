import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Trash2, FileText, Calendar, Warehouse, User, UserCheck, Package, CheckCircle, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import type { PhieuKiemKe } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

export interface PhieuKiemKeApprovePayload {
  trangThai: 'Đã duyệt' | 'Không duyệt';
  ghiChu?: string;
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  'Nháp': 'phieuKiemKe.status.nhap',
  'Đang kiểm': 'phieuKiemKe.status.dangKiem',
  'Chờ duyệt': 'phieuKiemKe.status.choDuyet',
  'Hoàn thành': 'phieuKiemKe.status.hoanThanh',
  'Đã duyệt': 'phieuKiemKe.status.daDuyet',
  'Không duyệt': 'phieuKiemKe.status.khongDuyet',
};

interface Props {
  data: PhieuKiemKe;
  onClose: () => void;
  onEdit: (item: PhieuKiemKe) => void;
  onDelete: (id: string) => void;
  onApprove?: (item: PhieuKiemKe, payload: PhieuKiemKeApprovePayload) => void;
}

const PhieuKiemKeDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onApprove }) => {
  const { t } = useTranslation();
  const canApprove = data.trang_thai === TRANG_THAI_CHO_DUYET && !!onApprove;
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [approveGhiChu, setApproveGhiChu] = useState('');

  const submitApprove = (trangThai: 'Đã duyệt' | 'Không duyệt') => {
    onApprove?.(data, { trangThai, ghiChu: approveGhiChu.trim() || undefined });
    setShowApprovePopup(false);
    setApproveGhiChu('');
  };

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () =>
      canApprove
        ? [
            {
              label: t('phieuKiemKe.detail.toolbar.approve'),
              icon: <CheckCircle size={16} />,
              onClick: () => setShowApprovePopup(true),
              variant: 'success' as const,
            },
          ]
        : [],
    [canApprove, t]
  );

  const statusLabel = t(STATUS_LABEL_KEYS[data.trang_thai] ?? data.trang_thai);
  const statusVariant =
    data.trang_thai === TRANG_THAI_CHO_DUYET
      ? 'amber'
      : data.trang_thai === TRANG_THAI_DA_DUYET
        ? 'primary'
        : data.trang_thai === TRANG_THAI_KHONG_DUYET
          ? 'rose'
          : 'secondary';

  return (
    <>
    <GenericDrawer
      title={t('phieuKiemKe.detail.title')}
      subtitle={data.so_phieu}
      icon={<FileText size={18} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
            {BTN_CLOSE()}
          </Button>
          <div className="flex items-center gap-3">
            <Button onClick={() => { onEdit(data); onClose(); }} className="bg-primary text-white shadow-lg hover:bg-primary/90">
              <Edit size={16} className="mr-2" /> {BTN_EDIT()}
            </Button>
            <Button variant="ghost" onClick={() => { onDelete(data.id); onClose(); }} className="text-rose-500 hover:bg-rose-50 border border-rose-200">
              <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
            </Button>
          </div>
        </div>
      }
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
                className={
                  statusVariant === 'amber'
                    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20'
                    : statusVariant === 'primary'
                      ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20'
                      : statusVariant === 'rose'
                        ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20'
                        : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border'
                }
              >
                <span
                  className={
                    statusVariant === 'amber'
                      ? 'w-1.5 h-1.5 rounded-full bg-amber-500'
                      : statusVariant === 'primary'
                        ? 'w-1.5 h-1.5 rounded-full bg-primary'
                        : statusVariant === 'rose'
                          ? 'w-1.5 h-1.5 rounded-full bg-rose-500'
                          : 'w-1.5 h-1.5 rounded-full bg-muted-foreground'
                  }
                />{' '}
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

      <DetailSection title={t('phieuKiemKe.detail.basicInfo')} icon={<FileText size={14} />}>
        <DetailFieldGrid>
          <DetailField icon={<FileText size={12} />} label={t('phieuKiemKe.form.code')} value={data.so_phieu} />
          <DetailField icon={<Calendar size={12} />} label={t('phieuKiemKe.form.date')} value={data.ngay} />
          <DetailField icon={<Warehouse size={12} />} label={t('phieuKiemKe.form.warehouse')} value={data.ten_kho ?? '—'} />
          <DetailField icon={<User size={12} />} label={t('phieuKiemKe.form.performer')} value={data.ten_nguoi_thuc_hien ?? '—'} />
          <DetailField icon={<UserCheck size={12} />} label={t('phieuKiemKe.form.approver')} value={data.ten_nguoi_duyet ?? '—'} />
          <DetailField icon={<FileText size={12} />} label={t('phieuKiemKe.form.status')} value={statusLabel} />
          {data.ghi_chu && (
            <DetailField icon={<FileText size={12} />} label={t('phieuKiemKe.form.notes')} value={data.ghi_chu} className="col-span-2" />
          )}
        </DetailFieldGrid>
      </DetailSection>

      <GenericSubTableSection
        title={t('phieuKiemKe.form.itemsSection')}
        icon={<Package size={14} className="text-primary" />}
        count={(data.chi_tiet ?? []).length}
        maxTableHeight="320px"
      >
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 font-medium text-muted-foreground w-8">#</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('phieuKiemKe.form.itemCode')}</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('phieuKiemKe.form.itemName')}</th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('phieuKiemKe.form.soLuongSo')}</th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('phieuKiemKe.form.soLuongThucTe')}</th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('phieuKiemKe.detail.chenhLech')}</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('phieuKiemKe.form.unit')}</th>
            </tr>
          </thead>
          <tbody>
            {(data.chi_tiet ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-muted-foreground text-sm">—</td>
              </tr>
            ) : (
              (data.chi_tiet ?? []).map((ct, idx) => (
                <tr key={ct.id} className="border-b border-border/60">
                  <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2 px-2 font-mono text-xs">{ct.ma_hang ?? '—'}</td>
                  <td className="py-2 px-2">{ct.ten_hang ?? '—'}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{Number(ct.so_luong_so).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{ct.so_luong_thuc_te != null ? Number(ct.so_luong_thuc_te).toLocaleString() : '—'}</td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {ct.chenh_lech != null ? (
                      <span className={Number(ct.chenh_lech) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {Number(ct.chenh_lech) >= 0 ? '+' : ''}{Number(ct.chenh_lech).toLocaleString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-2">{ct.don_vi_tinh ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GenericSubTableSection>

      <DetailSection title={t('phieuKiemKe.detail.systemInfo')} icon={<FileText size={14} />}>
        <DetailFieldGrid>
          <DetailField label={t('phieuKiemKe.detail.createdAt')} value={formatDateShort(data.tg_tao)} />
          <DetailField label={t('phieuKiemKe.detail.updatedAt')} value={formatDateShort(data.tg_cap_nhat)} />
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
                    {t('phieuKiemKe.detail.approveDialogTitle')}
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
                <p className="text-sm text-muted-foreground mt-1">{data.so_phieu}</p>
              </div>
              <div className="px-6 py-4 flex items-center justify-center gap-3">
                <Button
                  onClick={() => submitApprove(TRANG_THAI_KHONG_DUYET)}
                  className="bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-sm"
                >
                  <X size={16} className="mr-2" />
                  {t('phieuKiemKe.status.khongDuyet')}
                </Button>
                <Button
                  onClick={() => submitApprove(TRANG_THAI_DA_DUYET)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 shadow-sm"
                >
                  <CheckCircle size={16} className="mr-2" />
                  {t('phieuKiemKe.status.daDuyet')}
                </Button>
              </div>
              <div className="px-6 pb-4">
                <Textarea
                  label={t('phieuKiemKe.detail.approveDialogNote')}
                  placeholder={t('phieuKiemKe.detail.approveDialogNotePlaceholder')}
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
      </AnimatePresence>
    </>
  );
};

export default PhieuKiemKeDetail;
