import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { TRANG_THAI_DKNH_SEMANTIC } from '../core/trang-thai';
import type { TrangThaiDkNh } from '../core/types';

const TrangThaiBadge: React.FC<{ value: TrangThaiDkNh; className?: string }> = ({ value, className }) => {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        getStatusBadgeClass(TRANG_THAI_DKNH_SEMANTIC[value]),
        className
      )}
    >
      {t(`dangKyNhanHang.trangThai.${value}`)}
    </span>
  );
};

export default TrangThaiBadge;
