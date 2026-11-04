import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { cn } from '../../../../lib/utils';
import { usePresenceTransition } from '../../../../lib/usePresenceTransition';
import { pushOverlay, popOverlay, isTopOverlay } from '../../../../lib/overlay-stack';

interface Props {
  open: boolean;
  initialValue: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (noiDung: string) => void;
}

/** Dialog nhỏ nhập nội dung "Quản lý trao đổi" (chỉ quản trị module / cấp bậc 1). */
const DiemCongTruTraoDoiDialog: React.FC<Props> = ({ open, initialValue, isSaving, onClose, onSave }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const { mounted, visible } = usePresenceTransition(open);
  const overlayIdRef = useRef<number | null>(null);
  const savingRef = useRef(isSaving);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    savingRef.current = isSaving;
    onCloseRef.current = onClose;
  }, [isSaving, onClose]);

  useEffect(() => {
    if (open) setValue(initialValue);
    // Chỉ nạp lại giá trị ban đầu mỗi lần mở.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = pushOverlay();
    overlayIdRef.current = id;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || savingRef.current) return;
      if (overlayIdRef.current != null && !isTopOverlay(overlayIdRef.current)) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      popOverlay(id);
      overlayIdRef.current = null;
    };
  }, [open]);

  const requestClose = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);

  if (!mounted) return null;

  // Portal ra body: drawer cha có transform (presence-drawer) làm `fixed` bị kẹt trong khung drawer.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        role="presentation"
        onClick={requestClose}
        className={cn(
          'absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md presence-overlay',
          visible && 'presence-visible',
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dct-trao-doi-title"
        className={cn(
          'relative bg-card rounded-xl p-6 w-full shadow-2xl border border-border/40 outline-none presence-dialog',
          visible && 'presence-visible',
          DIALOG_SIZE.MEDIUM,
        )}
      >
        <h3 id="dct-trao-doi-title" className="text-base font-semibold text-foreground mb-4 pr-8">
          {t('diemCongTru.detail.traoDoiTitle')}
        </h3>
        <Textarea
          rows={5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('diemCongTru.detail.traoDoiPlaceholder')}
          disabled={isSaving}
        />
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={requestClose} disabled={isSaving} className="flex-1 h-9 rounded-md">
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onSave(value)} isLoading={isSaving} className="flex-1 h-9 rounded-md">
            {t('common.save')}
          </Button>
        </div>
        {!isSaving && (
          <button
            onClick={requestClose}
            aria-label={t('common.cancel')}
            className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default DiemCongTruTraoDoiDialog;
