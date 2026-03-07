/**
 * Dialog nhập kết quả kiểm cho một dòng chi tiết: số lượng thực tế, ghi chú.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import { cn } from '../../../../lib/utils';
import type { ChiTietKiemKeKho, ChiTietKiemKeKhoUpdate } from '../core/types';

interface Props {
  open: boolean;
  row: ChiTietKiemKeKho | null;
  onClose: () => void;
  onSave: (data: ChiTietKiemKeKhoUpdate) => void;
  isLoading?: boolean;
}

const NhapKetQuaKiemKeDialog: React.FC<Props> = ({
  open,
  row,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [so_luong_thuc_te, setSoLuongThucTe] = useState<string>('');
  const [ghi_chu_dong, setGhiChuDong] = useState<string>('');

  useEffect(() => {
    if (open && row) {
      setSoLuongThucTe(row.so_luong_thuc_te != null ? String(row.so_luong_thuc_te) : '');
      setGhiChuDong(row.ghi_chu_dong ?? '');
    }
  }, [open, row]);

  const handleGiongSo = useCallback(() => {
    if (!row) return;
    setSoLuongThucTe(String(row.so_luong_so));
  }, [row]);

  const handleSave = useCallback(() => {
    const num = so_luong_thuc_te.trim() === '' ? null : parseInt(so_luong_thuc_te, 10);
    if (num != null && (Number.isNaN(num) || num < 0)) return;
    onSave({
      so_luong_thuc_te: num != null && !Number.isNaN(num) ? num : null,
      ghi_chu_dong: ghi_chu_dong.trim() || null,
    });
  }, [so_luong_thuc_te, ghi_chu_dong, onSave]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  if (!open) return null;

  const hangHoaLabel = row ? (row.ten_hang || row.ma_hang || '—') : '';
  const soLuongSo = row?.so_luong_so ?? 0;
  const donViTinh = row?.don_vi_tinh ?? '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-md"
      />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full min-w-[min(100%,28rem)] max-w-lg bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col',
            'max-h-[90vh] min-h-[20rem] overflow-visible'
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t('kiemKeKho.nhapKetQua.title')}
                </h3>
                {hangHoaLabel && (
                  <p className="text-xs text-muted-foreground truncate max-w-[240px]" title={hangHoaLabel}>
                    {hangHoaLabel}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-visible p-5 space-y-4">
            {row && (
              <p className="text-sm text-muted-foreground">
                {t('kiemKeKho.nhapKetQua.soLuongSo')}: <strong>{soLuongSo}</strong>
                {donViTinh ? ` ${donViTinh}` : ''}
              </p>
            )}
            <Input
              type="number"
              min={0}
              label={t('kiemKeKho.nhapKetQua.soLuongThucTe')}
              value={so_luong_thuc_te}
              onChange={(e) => setSoLuongThucTe(e.target.value)}
              placeholder={t('kiemKeKho.nhapKetQua.placeholderSoLuong')}
            />
            <Textarea
              label={t('kiemKeKho.nhapKetQua.ghiChuDong')}
              value={ghi_chu_dong}
              onChange={(e) => setGhiChuDong(e.target.value)}
              rows={2}
              className="resize-none"
            />
            {row && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
                onClick={handleGiongSo}
                disabled={isLoading}
              >
                {t('kiemKeKho.nhapKetQua.giongSo')}
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isLoading}
              className="bg-primary text-white"
            >
              {t('kiemKeKho.nhapKetQua.save')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NhapKetQuaKiemKeDialog;
