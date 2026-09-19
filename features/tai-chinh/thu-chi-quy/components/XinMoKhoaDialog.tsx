import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Unlock, X, Info } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Textarea from '../../../../components/ui/Textarea';
import { BTN_CANCEL } from '../../../../lib/button-labels';

interface Props {
  soPhieu: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (lyDo: string) => void;
}

/**
 * Popup nhập lý do xin mở khoá. Lý do BẮT BUỘC: người duyệt ở xa, không có lý do
 * thì họ chỉ thấy "ai đó xin mở phiếu nào đó" và sẽ duyệt bừa.
 * Chỉ mount khi đang mở (cha render có điều kiện) nên state tự sạch mỗi lần mở lại.
 */
const XinMoKhoaDialog: React.FC<Props> = ({ soPhieu, isPending, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [lyDo, setLyDo] = useState('');
  const [touched, setTouched] = useState(false);

  const loi = touched && !lyDo.trim() ? t('thuChiQuy.moKhoa.lyDoRequired') : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (isPending || !lyDo.trim()) return;
    onConfirm(lyDo.trim());
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
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Unlock size={18} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t('thuChiQuy.moKhoa.xinMoTitle', { soPhieu })}
              </h3>
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
            <div className="flex gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p>{t('thuChiQuy.moKhoa.xinMoHint')}</p>
            </div>

            <Textarea
              label={t('thuChiQuy.moKhoa.lyDoLabel')}
              placeholder={t('thuChiQuy.moKhoa.lyDoPlaceholder')}
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              required
              error={loi}
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
              <Button type="submit" className="bg-primary text-white" disabled={isPending}>
                {t('thuChiQuy.moKhoa.guiYeuCau')}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default XinMoKhoaDialog;
