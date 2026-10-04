import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import { getStatusBadgeClass, type StatusBadgeSemantic } from '../../../../lib/status-badge';
import { KET_LUAN_GSCL_SEMANTIC, TRANG_THAI_GSCL_SEMANTIC } from '../core/trang-thai';
import type { KetLuanGscl, TrangThaiGscl } from '../core/types';

const Badge: React.FC<{ semantic: StatusBadgeSemantic; className?: string; children: React.ReactNode }> = ({
  semantic,
  className,
  children,
}) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
      getStatusBadgeClass(semantic),
      className
    )}
  >
    {children}
  </span>
);

export const TrangThaiBadge: React.FC<{ value: TrangThaiGscl; className?: string }> = ({ value, className }) => {
  const { t } = useTranslation();
  return (
    <Badge semantic={TRANG_THAI_GSCL_SEMANTIC[value]} className={className}>
      {t(`giamSatChatLuong.trangThai.${value}`)}
    </Badge>
  );
};

/** Kết luận cây hàng; `tamTinh` = chưa đủ thùng, đang hiện kết quả tạm. */
export const KetLuanBadge: React.FC<{ value: KetLuanGscl | null; tamTinh?: boolean; className?: string }> = ({
  value,
  tamTinh,
  className,
}) => {
  const { t } = useTranslation();
  if (!value) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <Badge semantic={tamTinh ? 'neutral' : KET_LUAN_GSCL_SEMANTIC[value]} className={className}>
      {t(`giamSatChatLuong.ketLuan.${value}`)}
      {tamTinh ? ` (${t('giamSatChatLuong.ketLuan.tamTinh')})` : ''}
    </Badge>
  );
};
