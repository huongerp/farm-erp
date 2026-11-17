import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { LoaiPhieuKhoTab } from '../core/types';

interface Props {
  soPhieu: string;
  /** Loại của phiếu đang sao chép — đánh dấu "cùng loại". */
  loaiHienTai: LoaiPhieuKhoTab;
  onChon: (loai: LoaiPhieuKhoTab) => void;
  onClose: () => void;
}

const LUA_CHON: { loai: LoaiPhieuKhoTab; icon: React.ReactNode; mau: string }[] = [
  { loai: 'nhap', icon: <ArrowDownToLine size={18} />, mau: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { loai: 'xuat', icon: <ArrowUpFromLine size={18} />, mau: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { loai: 'chuyen', icon: <ArrowRightLeft size={18} />, mau: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
];

/**
 * Popup chọn loại phiếu khi "Sao chép phiếu": bấm một loại là mở ngay form tạo phiếu mới loại đó
 * với kho + hàng + SL + đơn giá của phiếu gốc (vd. vừa nhập xong → xuất luôn).
 * Render cạnh drawer chi tiết (fixed, z cao) như popup Duyệt.
 */
const ChonLoaiSaoChepDialog: React.FC<Props> = ({ soPhieu, loaiHienTai, onChon, onClose }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-2xl border border-border shadow-2xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 pt-4 pb-3 border-b border-border bg-muted/30 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{t('phieuKho.saoChep.title')}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{soPhieu}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-muted-foreground">{t('phieuKho.saoChep.hint')}</p>
          {LUA_CHON.map(({ loai, icon, mau }) => (
            <button
              key={loai}
              type="button"
              onClick={() => onChon(loai)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-all',
                'hover:bg-muted/60 hover:shadow-sm active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', mau)}>{icon}</span>
              <span className="flex-1 font-medium text-foreground">{t(`phieuKho.tabs.${loai}`)}</span>
              {loai === loaiHienTai && (
                <span className="text-xs text-muted-foreground">{t('phieuKho.saoChep.cungLoai')}</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChonLoaiSaoChepDialog;
