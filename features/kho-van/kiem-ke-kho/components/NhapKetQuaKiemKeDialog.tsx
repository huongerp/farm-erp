/**
 * Dialog nhập kết quả kiểm cho một dòng chi tiết: số lượng thực tế, ghi chú.
 *
 * Người đi kho thường nhập liên tục từng dòng trên điện thoại: "Lưu & dòng tiếp"
 * mở luôn dòng chưa kiểm kế tiếp, Enter = lưu, ô số bật bàn phím số.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ClipboardCheck, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import { cn, formatNumberVN } from '../../../../lib/utils';
import type { ChiTietKiemKeKho, ChiTietKiemKeKhoUpdate } from '../core/types';

interface Props {
  open: boolean;
  row: ChiTietKiemKeKho | null;
  onClose: () => void;
  /** `next = true`: người dùng bấm "Lưu & dòng tiếp". */
  onSave: (data: ChiTietKiemKeKhoUpdate, next: boolean) => void;
  /** Còn dòng chưa kiểm phía sau không — quyết định có hiện nút "Lưu & dòng tiếp". */
  hasNext?: boolean;
  isLoading?: boolean;
}

const NhapKetQuaKiemKeDialog: React.FC<Props> = ({
  open,
  row,
  onClose,
  onSave,
  hasNext = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [so_luong_thuc_te, setSoLuongThucTe] = useState<string>('');
  const [ghi_chu_dong, setGhiChuDong] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && row) {
      setSoLuongThucTe(row.so_luong_thuc_te != null ? String(row.so_luong_thuc_te) : '');
      setGhiChuDong(row.ghi_chu_dong ?? '');
      setError(undefined);
      // Đổi dòng (Lưu & dòng tiếp) thì dialog không mount lại — tự đặt con trỏ vào ô số.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, row]);

  const handleGiongSo = useCallback(() => {
    if (!row) return;
    setSoLuongThucTe(String(row.so_luong_so));
    setError(undefined);
  }, [row]);

  const handleSave = useCallback(
    (next: boolean) => {
      if (isLoading) return;
      // numeric(18,4) — trước đây `parseInt` cắt ngầm phần lẻ (2,5 kg lưu thành 2).
      const raw = so_luong_thuc_te.trim().replace(',', '.');
      const num = raw === '' ? null : Number(raw);
      if (num != null && (Number.isNaN(num) || num < 0)) {
        setError(t('kiemKeKho.validation.soLuongNonNegative'));
        return;
      }
      onSave({ so_luong_thuc_te: num, ghi_chu_dong: ghi_chu_dong.trim() || null }, next);
    },
    [so_luong_thuc_te, ghi_chu_dong, onSave, isLoading, t]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  const hangHoaLabel = row ? row.ten_hang || row.ma_hang || '—' : '';
  const soLuongSo = row?.so_luong_so ?? 0;
  const donViTinh = row?.don_vi_tinh ?? '';

  return (
    <AnimatePresence>
      {open && row && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col',
                'max-h-[90dvh] overflow-y-auto'
              )}
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    <ClipboardCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{t('kiemKeKho.nhapKetQua.title')}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2" title={hangHoaLabel}>
                      {hangHoaLabel}
                      {row.ten_kho ? ` · ${row.ten_kho}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  aria-label={t('common.close')}
                  className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                className="flex-1 p-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave(hasNext);
                }}
              >
                {row.id_phieu_kho_dieu_chinh && (
                  <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    {t('kiemKeKho.nhapKetQua.daDieuChinhWarning')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('kiemKeKho.nhapKetQua.soLuongSo')}:{' '}
                  <strong className="text-foreground tabular-nums">{formatNumberVN(soLuongSo)}</strong>
                  {donViTinh ? ` ${donViTinh}` : ''}
                </p>
                <div className="flex items-end gap-2">
                  <div className="flex-1 min-w-0">
                    <Input
                      ref={inputRef}
                      type="text"
                      inputMode="decimal"
                      enterKeyHint={hasNext ? 'next' : 'done'}
                      autoComplete="off"
                      label={t('kiemKeKho.nhapKetQua.soLuongThucTe')}
                      value={so_luong_thuc_te}
                      onChange={(e) => {
                        setSoLuongThucTe(e.target.value);
                        setError(undefined);
                      }}
                      placeholder={t('kiemKeKho.nhapKetQua.placeholderSoLuong')}
                      error={error}
                      className="h-11 text-base tabular-nums"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                    onClick={handleGiongSo}
                    disabled={isLoading}
                  >
                    {t('kiemKeKho.nhapKetQua.giongSo')}
                  </Button>
                </div>
                <Textarea
                  label={t('kiemKeKho.nhapKetQua.ghiChuDong')}
                  value={ghi_chu_dong}
                  onChange={(e) => setGhiChuDong(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                {/* Enter trong ô số submit form: có dòng tiếp thì lưu & sang dòng tiếp. */}
                <button type="submit" hidden aria-hidden tabIndex={-1} />
              </form>

              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-5 py-4 border-t border-border shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button variant="outline" onClick={handleClose} disabled={isLoading} className="h-11 sm:h-9">
                  {t('common.cancel')}
                </Button>
                <Button
                  variant={hasNext ? 'outline' : 'default'}
                  onClick={() => handleSave(false)}
                  isLoading={isLoading}
                  className={cn('h-11 sm:h-9', !hasNext && 'bg-primary text-white')}
                >
                  {t('kiemKeKho.nhapKetQua.save')}
                </Button>
                {hasNext && (
                  <Button
                    onClick={() => handleSave(true)}
                    isLoading={isLoading}
                    className="h-11 sm:h-9 bg-primary text-white flex-1 sm:flex-none"
                  >
                    {t('kiemKeKho.nhapKetQua.saveAndNext')}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NhapKetQuaKiemKeDialog;
