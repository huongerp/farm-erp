import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  getDrawerWidthClass,
  DRAWER_WIDTH_FORM,
  DRAWER_WIDTH_DETAIL,
  DRAWER_Z_BASE,
  DRAWER_Z_CONTENT_BASE,
} from '../../lib/dialog-sizes';

export { DRAWER_WIDTH_FORM, DRAWER_WIDTH_DETAIL };

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
};

interface GenericDrawerProps {
  title: string;
  /** Chuỗi hoặc ReactNode (vd. badge màu) */
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Class width (mặc định theo stackLevel). Truyền khi cần override. */
  maxWidthClass?: string;
  variant?: 'drawer' | 'modal';
  /** 0 = drawer nền (48rem), >= 1 = drawer chồng (44rem) + z-index tăng */
  stackLevel?: number;
}

const GenericDrawer: React.FC<GenericDrawerProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  maxWidthClass: maxWidthClassProp,
  variant = 'drawer',
  stackLevel = 0,
}) => {
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const isModal = variant === 'modal';
  /** Trên mobile, modal hiển thị full-screen thay vì hộp giữa màn hình */
  const modalFullScreen = isModal && isMobile;
  const widthClass = maxWidthClassProp ?? getDrawerWidthClass(stackLevel);
  const zOffset = isModal ? 5 : stackLevel * 2;
  const zIndexBackdrop = DRAWER_Z_BASE + zOffset;
  const zIndexContent = DRAWER_Z_CONTENT_BASE + zOffset;

  // Save opener for focus restore on close
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    return () => {
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus({ preventScroll: true });
      }
    };
  }, []);

  // Escape key to close + focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
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
    setTimeout(() => drawerRef.current?.focus(), 100);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const Content = (
    <>
      <div
        className={`flex items-center justify-between gap-4 border-b border-border/60 bg-card/80 backdrop-blur-xl shrink-0 ${!modalFullScreen && isModal ? 'rounded-t-2xl' : ''}`}
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
          paddingBottom: '0.5rem',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground leading-tight truncate">
              {title}
            </h3>
            {subtitle != null && subtitle !== '' && (
              typeof subtitle === 'string' ? (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
              ) : (
                <div className="mt-0.5 flex items-center min-w-0">{subtitle}</div>
              )
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90 shrink-0"
        >
          <X size={20} className="stroke-[2.5px]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/50 p-4 sm:p-5 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>

      {footer && (
        <div
          className={`bg-card border-t border-border/60 flex flex-col-reverse sm:flex-row items-center gap-3 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)] shrink-0 w-full ${!modalFullScreen && isModal ? 'rounded-b-2xl' : ''}`}
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {footer}
        </div>
      )}
    </>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-md"
        style={{ zIndex: zIndexBackdrop }}
      />

      {isModal ? (
        <div className={`fixed inset-0 pointer-events-none ${modalFullScreen ? 'flex flex-col' : 'flex items-center justify-center p-4'}`} style={{ zIndex: zIndexContent }}>
          <motion.div
            initial={modalFullScreen ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.9, y: 30 }}
            animate={modalFullScreen ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={modalFullScreen ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full bg-card shadow-ultra flex flex-col pointer-events-auto border border-border/40 outline-none ${modalFullScreen ? 'h-full min-h-[100dvh] max-h-none rounded-none' : `${widthClass} max-h-[90vh] rounded-2xl`}`}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
          >
            {Content}
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={`fixed inset-y-0 right-0 w-full ${widthClass} bg-card shadow-ultra flex flex-col h-[100dvh] border-l border-border/40 outline-none`}
          style={{ zIndex: zIndexContent }}
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
        >
          {Content}
        </motion.div>
      )}
    </>
  );
};

export default GenericDrawer;
