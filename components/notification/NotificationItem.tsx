import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { NotificationType } from '../../types';
import type { ThongBao } from '../../features/thong-bao/core/types';
import { kieuHienThi, khoaI18nTenModule } from '../../features/thong-bao/core/loai-su-kien';
import { nhanThoiGian } from '../../features/thong-bao/core/nhom-theo-ngay';

const typeConfig: Record<
  NotificationType,
  { icon: typeof Info; className: string }
> = {
  info: { icon: Info, className: 'text-primary bg-primary/10' },
  success: { icon: CheckCircle, className: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  warning: { icon: AlertTriangle, className: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
  error: { icon: AlertCircle, className: 'text-rose-600 bg-rose-500/10 dark:text-rose-400' },
};

interface NotificationItemProps {
  item: ThongBao;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
  /** Đóng panel sau khi điều hướng, để người dùng thấy ngay trang vừa mở. */
  onNavigate?: () => void;
  /** Hiện tên module trên dòng thời gian — chỉ cần khi danh sách trộn nhiều module. */
  hienTenModule?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onMarkRead,
  onRemove,
  onNavigate,
  hienTenModule = false,
}) => {
  const { t } = useTranslation();
  const khoaTenModule = hienTenModule ? khoaI18nTenModule(item.moduleId) : null;
  const config = typeConfig[kieuHienThi(item.loaiSuKien)];
  const Icon = config.icon;

  const content = (
    <>
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          config.className
        )}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-xs leading-tight',
          item.daDoc
            ? 'font-medium text-foreground'
            : 'font-semibold text-primary'
        )}>
          {item.tieuDe}
        </p>
        {item.noiDung && (
          <p className={cn(
            'text-xs mt-0.5 line-clamp-2',
            item.daDoc ? 'text-muted-foreground' : 'text-foreground/80'
          )}>
            {item.noiDung}
          </p>
        )}
        <p className="text-2xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
          {khoaTenModule && (
            <>
              <span className="font-medium text-foreground/70">{t(khoaTenModule)}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{nhanThoiGian(item.tgTao, t)}</span>
          {/* Sự kiện lặp lại được gộp vào một dòng — hiện số lần để không mất thông tin. */}
          {item.soLan > 1 && (
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {t('notification.repeated', { count: item.soLan })}
            </span>
          )}
        </p>
      </div>
    </>
  );

  const handleClick = () => {
    if (!item.daDoc) onMarkRead(item.id);
    onNavigate?.();
  };

  const wrapperClass = cn(
    'flex gap-3 p-3 rounded-xl transition-colors text-left w-full relative',
    item.daDoc
      ? 'hover:bg-muted/60'
      : 'bg-primary/10 hover:bg-primary/15 border-l-[3px] border-primary'
  );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="relative group"
    >
      {item.link ? (
        <Link
          to={item.link}
          className={wrapperClass}
          onClick={handleClick}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          className={wrapperClass}
          onClick={handleClick}
        >
          {content}
        </button>
      )}
      <button
        type="button"
        aria-label={t('notification.remove')}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="absolute top-2.5 right-2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </motion.li>
  );
};

export default NotificationItem;
