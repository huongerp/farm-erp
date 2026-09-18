import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI_PT_DA_DUYET, TRANG_THAI_PT_KHONG_DUYET } from '../core/constants';
import type { TrangThaiPhieuKhoPT } from '../core/types';

interface Props {
  /** Số phiếu thực sự được áp dụng (đã lọc). */
  count: number;
  /** Số phiếu bị bỏ qua vì đã có quyết định duyệt. */
  skipped: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (trangThai: TrangThaiPhieuKhoPT, ghiChu: string) => void;
}

const OPTIONS = [
  { value: TRANG_THAI_PT_DA_DUYET as TrangThaiPhieuKhoPT, icon: <CheckCircle size={15} />, color: 'emerald' },
  { value: TRANG_THAI_PT_KHONG_DUYET as TrangThaiPhieuKhoPT, icon: <XCircle size={15} />, color: 'rose' },
] as const;

/**
 * Duyệt hàng loạt: chọn trạng thái đích + ghi chú chung rồi xác nhận.
 * Chỉ mount khi đang mở (cha render có điều kiện) nên state tự sạch mỗi lần mở lại.
 */
const PhieuKhoPTBulkApproveDialog: React.FC<Props> = ({
  count,
  skipped,
  isPending,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [trangThai, setTrangThai] = useState<TrangThaiPhieuKhoPT>(TRANG_THAI_PT_DA_DUYET);
  const [ghiChu, setGhiChu] = useState('');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('phieuKhoPhanThuoc.bulkApproveDialog.title')}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('phieuKhoPhanThuoc.bulkApproveDialog.subtitle', { count })}
          </p>
        </div>

        {skipped > 0 && (
          <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>{t('phieuKhoPhanThuoc.bulkApproveDialog.skipped', { count: skipped })}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {OPTIONS.map((opt) => {
            const selected = trangThai === opt.value;
            const label =
              opt.value === TRANG_THAI_PT_DA_DUYET
                ? t('phieuKhoPhanThuoc.approveDialog.approveButton')
                : t('phieuKhoPhanThuoc.approveDialog.rejectButton');
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTrangThai(opt.value)}
                disabled={isPending}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
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
          label={t('phieuKhoPhanThuoc.bulkApproveDialog.note')}
          placeholder={t('phieuKhoPhanThuoc.approveDialog.notePlaceholder')}
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          rows={3}
          disabled={isPending}
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="border border-border"
          >
            {BTN_CLOSE()}
          </Button>
          <Button
            onClick={() => onConfirm(trangThai, ghiChu.trim())}
            disabled={isPending || count === 0}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            {isPending ? '...' : t('phieuKhoPhanThuoc.approveDialog.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhieuKhoPTBulkApproveDialog;
