import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../../lib/constants';

/** Badge Đang hoạt động / Ngừng hoạt động — cùng kiểu với danh sách hàng hoá Kho vận. */
const TrangThaiHangHoaBadge: React.FC<{ trangThai: TrangThaiHoatDong; className?: string }> = ({
  trangThai,
  className,
}) => {
  const { t } = useTranslation();
  const dang = trangThai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        dang ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dang ? 'bg-primary' : 'bg-muted-foreground')} />
      {dang ? t('farmHangHoaPhanThuoc.hangHoa.active') : t('farmHangHoaPhanThuoc.hangHoa.inactive')}
    </span>
  );
};

export default TrangThaiHangHoaBadge;
