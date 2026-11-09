import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import { getStatusBadgeClass, type StatusBadgeSemantic } from '../../../../lib/status-badge';
import { TRANG_THAI_CL_SEMANTIC } from '../core/trang-thai';
import type { KetLuanVanHanh, TrangThaiCl } from '../core/types';

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

export const TrangThaiBadge: React.FC<{ value: TrangThaiCl; className?: string }> = ({ value, className }) => {
  const { t } = useTranslation();
  return (
    <Badge semantic={TRANG_THAI_CL_SEMANTIC[value]} className={className}>
      {t(`checklistBanGiao.trangThai.${value}`)}
    </Badge>
  );
};

const KET_LUAN_SEMANTIC: Record<KetLuanVanHanh, StatusBadgeSemantic> = {
  du_dieu_kien: 'success',
  co_dieu_kien: 'warning',
  tam_dung: 'rejected',
};

export const KetLuanVanHanhBadge: React.FC<{ value: KetLuanVanHanh | null; className?: string }> = ({ value, className }) => {
  const { t } = useTranslation();
  if (!value) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <Badge semantic={KET_LUAN_SEMANTIC[value]} className={className}>
      {t(`checklistBanGiao.ketLuan.${value}`)}
    </Badge>
  );
};

/** Ô tích Đạt / Không đạt (chỉ hiển thị, không phải nút). */
export const KetQuaTick: React.FC<{ value: 'dat' | 'khong_dat' | null; className?: string }> = ({ value, className }) => {
  const { t } = useTranslation();
  if (!value) return <span className="text-muted-foreground text-sm">—</span>;
  const dat = value === 'dat';
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border',
        dat ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        className
      )}
    >
      {dat ? t('checklistBanGiao.ketQua.dat') : t('checklistBanGiao.ketQua.khongDat')}
    </span>
  );
};
