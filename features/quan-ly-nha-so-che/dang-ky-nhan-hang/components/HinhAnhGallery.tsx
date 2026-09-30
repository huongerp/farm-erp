import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/** Lưới ảnh thu nhỏ + lightbox (trước/sau, phím ←/→/Esc) — cùng khuôn HopDongDetail. */
const HinhAnhGallery: React.FC<{ urls: string[] }> = ({ urls }) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(() => setIndex((i) => (i != null && i > 0 ? i - 1 : i)), []);
  const next = useCallback(() => setIndex((i) => (i != null && i < urls.length - 1 ? i + 1 : i)), [urls.length]);

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, close, prev, next]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setIndex(i)}
            className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/30 hover:ring-2 hover:ring-primary/40 transition"
          >
            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {index !== null &&
        ReactDOM.createPortal(
          <AnimatePresence>
            <motion.div
              key="dknh-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={close}
            >
              <motion.img
                key={urls[index]}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                src={urls[index]}
                alt=""
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={close}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
              {index > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  aria-label={t('dangKyNhanHang.anh.prev')}
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {index < urls.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  aria-label={t('dangKyNhanHang.anh.next')}
                >
                  <ChevronRight size={20} />
                </button>
              )}
              {urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums select-none">
                  {index + 1} / {urls.length}
                </div>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default HinhAnhGallery;
