import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { TINH_TRANG_PHIEU_XUAT_SEMANTIC, type TinhTrangPhieuXuat } from '../core/phieu-xuat';

/** Tình trạng phiếu xuất kho của xe; NULL (xe chưa có cây hàng) hiện "—". */
const PhieuXuatBadge: React.FC<{ value: TinhTrangPhieuXuat | null; className?: string }> = ({ value, className }) => {
  const { t } = useTranslation();
  if (!value) return <span className={cn('text-muted-foreground text-sm', className)}>—</span>;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        getStatusBadgeClass(TINH_TRANG_PHIEU_XUAT_SEMANTIC[value]),
        className
      )}
    >
      {t(`dangKyNhanHang.phieuXuat.tinhTrang.${value}`)}
    </span>
  );
};

export default PhieuXuatBadge;
