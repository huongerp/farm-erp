import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import type { TinhTrangKetNoi, TinhTrangLich } from '../core/trang-thai';

const MAU: Record<TinhTrangKetNoi | TinhTrangLich, string> = {
  hoat_dong: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  binh_thuong: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  cho_ghi: 'bg-primary/10 text-primary border-primary/20',
  co_loi: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
  loi: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
  hong: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  da_dung: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  nghi_viec: 'bg-muted text-muted-foreground border-border',
  tam_dung: 'bg-muted text-muted-foreground border-border',
};

/** Nhãn tình trạng dùng chung cho bảng kết nối và danh sách lịch. */
const TinhTrangBadge: React.FC<{ value: TinhTrangKetNoi | TinhTrangLich }> = ({ value }) => {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap', MAU[value])}>
      {t(`ketNoiGoogle.status.${value}`)}
    </span>
  );
};

export default TinhTrangBadge;
