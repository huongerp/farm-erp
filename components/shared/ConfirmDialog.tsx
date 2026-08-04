
import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import { useConfirmStore } from '../../store/useConfirmStore';
import { DIALOG_SIZE } from '../../lib/dialog-sizes';
import { cn } from '../../lib/utils';
import { usePresenceTransition } from '../../lib/usePresenceTransition';
import { pushOverlay, popOverlay, isTopOverlay } from '../../lib/overlay-stack';
import i18n from '../../lib/i18n';

const ConfirmDialog: React.FC = () => {
  const { isOpen, options, close, isLoading, setLoading } = useConfirmStore();
  const { title, message, variant, confirmText, cancelText, onConfirm, onCancel } = options;
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayIdRef = useRef<number | null>(null);
  const { mounted, visible } = usePresenceTransition(isOpen);

  // Đăng ký vào overlay stack chỉ khi đang mở — cùng cơ chế với GenericDrawer
  // (xem lib/overlay-stack.ts) để Escape không xuyên qua confirm dialog đóng luôn
  // drawer bên dưới.
  useEffect(() => {
    if (!isOpen) return;
    const id = pushOverlay();
    overlayIdRef.current = id;
    return () => {
      popOverlay(id);
      overlayIdRef.current = null;
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      close();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Confirm action failed', error);
      const msg = error instanceof Error && error.message.trim() ? error.message.trim() : '';
      toast.error(msg || i18n.t('common.error'));
      setLoading(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (onCancel) onCancel();
    close();
  }, [onCancel, close]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (el) el.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        if (overlayIdRef.current != null && !isTopOverlay(overlayIdRef.current)) return;
        handleCancel();
        return;
      }
      // Trap focus within dialog
      if (e.key === 'Tab' && el) {
        const focusable = el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, handleCancel]);

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4"><Trash2 size={24} /></div>;
      case 'warning':
        return <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4"><AlertTriangle size={24} /></div>;
      default:
        return <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4"><Info size={24} /></div>;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger': return 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 dark:shadow-rose-950/40';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 dark:shadow-amber-950/40';
      default: return 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20';
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={!isLoading ? handleCancel : undefined}
        className={cn(
          'absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md presence-overlay',
          visible && 'presence-visible',
        )}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        tabIndex={-1}
        className={cn(
          'relative bg-card rounded-xl p-6 w-full shadow-2xl border border-border/40 flex flex-col items-center text-center outline-none presence-dialog',
          visible && 'presence-visible',
          DIALOG_SIZE.CONFIRM,
        )}
      >
        {getIcon()}

        <h3 id="confirm-dialog-title" className="text-base font-semibold text-foreground mb-2">{title}</h3>

        <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {message}
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 border-border text-muted-foreground hover:bg-muted h-9 rounded-md"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={isLoading}
            className={`flex-1 h-9 rounded-md ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </Button>
        </div>

        {!isLoading && (
          <button
            onClick={handleCancel}
            aria-label="Đóng"
            className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfirmDialog;
