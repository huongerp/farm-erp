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
  title: string;
  placeholder: string;
  /** Bắt buộc nhập lý do (Trả lại / Mở lại); Huỷ có thể bỏ trống. */
  batBuoc: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (lyDo: string) => void;
}

/** Dialog nhập lý do (trả lại / huỷ / mở lại phiếu) — portal ra body vì mở chồng trên drawer. */
const LyDoDialog: React.FC<Props> = ({ open, title, placeholder, batBuoc, isSaving, onClose, onSave }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const { mounted, visible } = usePresenceTransition(open);
  const overlayIdRef = useRef<number | null>(null);
  const savingRef = useRef(isSaving);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    savingRef.current = isSaving;
    onCloseRef.current = onClose;
  }, [isSaving, onClose]);

  useEffect(() => {
    if (open) {
      setValue('');
      setErr(null);
    }
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

  const submit = () => {
    if (batBuoc && !value.trim()) {
      setErr(t('checklistBanGiao.lyDo.required'));
      return;
    }
    onSave(value.trim());
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        role="presentation"
        onClick={requestClose}
        className={cn('absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md presence-overlay', visible && 'presence-visible')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cl-lydo-title"
        className={cn(
          'relative bg-card rounded-xl p-6 w-full shadow-2xl border border-border/40 outline-none presence-dialog',
          visible && 'presence-visible',
          DIALOG_SIZE.COMPACT
        )}
      >
        <h3 id="cl-lydo-title" className="text-base font-semibold text-foreground mb-4 pr-8">
          {title}
        </h3>
        <Textarea
          rows={4}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setErr(null);
          }}
          placeholder={placeholder}
          disabled={isSaving}
          error={err ?? undefined}
          autoFocus
        />
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={requestClose} disabled={isSaving} className="flex-1 h-9 rounded-md">
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} isLoading={isSaving} className="flex-1 h-9 rounded-md">
            {t('common.confirm')}
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
    document.body
  );
};

export default LyDoDialog;
