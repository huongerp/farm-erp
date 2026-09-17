import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertTriangle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CANCEL } from '../../../../lib/button-labels';
import ApproveOption, { APPROVE_OPTION_STYLE } from './ApproveOption';
import {
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_KHONG_DUYET,
  trangThaiToI18nKey,
} from '../core/constants';
import type { TrangThaiPhieuKho } from '../core/types';

interface Props {
  /** Số phiếu thực sự được áp dụng (đã lọc). */
  count: number;
  /** Số phiếu bị bỏ qua vì đã có quyết định duyệt. */
  skipped: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (trangThai: TrangThaiPhieuKho, ghiChu: string) => void;
}

const TARGET_STATUSES: TrangThaiPhieuKho[] = [
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_KHONG_DUYET,
];

/**
 * Duyệt hàng loạt: chọn trạng thái đích + ghi chú chung, rồi xác nhận.
 * Khác popup duyệt lẻ ở chỗ chọn trước — bấm một nút trạng thái không chạy ngay, tránh lỡ tay
 * đổi trạng thái cả lô.
 *
 * Chỉ được mount khi đang mở (cha render có điều kiện), nên state tự sạch mỗi lần mở lại — không
 * cần effect reset.
 */
const PhieuKhoBulkApproveDialog: React.FC<Props> = ({
  count,
  skipped,
  isPending,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [trangThai, setTrangThai] = useState<TrangThaiPhieuKho>(TRANG_THAI_DA_DUYET);
  const [ghiChu, setGhiChu] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || count === 0) return;
    onConfirm(trangThai, ghiChu.trim());
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pt-5 pb-4 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('phieuKho.bulkApproveDialog.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('phieuKho.bulkApproveDialog.subtitle', { count })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {skipped > 0 && (
              <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p>{t('phieuKho.bulkApproveDialog.skipped', { count: skipped })}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t('phieuKho.bulkApproveDialog.status')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_STATUSES.map((status) => (
                  <ApproveOption
                    key={status}
                    label={t(`phieuKho.status.${trangThaiToI18nKey(status)}`)}
                    {...APPROVE_OPTION_STYLE[status]}
                    selected={trangThai === status}
                    onClick={() => setTrangThai(status)}
                    disabled={isPending}
                  />
                ))}
              </div>
            </div>

            <Textarea
              label={t('phieuKho.bulkApproveDialog.note')}
              placeholder={t('phieuKho.bulkApproveDialog.notePlaceholder')}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isPending}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isPending}
                className="border border-border"
              >
                {BTN_CANCEL()}
              </Button>
              <Button type="submit" className="bg-primary text-white" disabled={isPending || count === 0}>
                {isPending
                  ? t('phieuKho.bulkApproveDialog.submitting')
                  : t('phieuKho.approveDialog.submit')}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhieuKhoBulkApproveDialog;
