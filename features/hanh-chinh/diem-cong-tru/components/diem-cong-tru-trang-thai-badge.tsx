import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Unlock } from 'lucide-react';
import type { DiemCongTruTrangThai } from '../core/types';

/** Badge Mở / Khoá dùng chung cho bảng và drawer chi tiết. */
const DiemCongTruTrangThaiBadge: React.FC<{ trangThai: DiemCongTruTrangThai }> = ({ trangThai }) => {
  const { t } = useTranslation();
  return trangThai === 'khoa' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900 whitespace-nowrap">
      <Lock size={12} />
      {t('diemCongTru.trangThai.khoa')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
      <Unlock size={12} />
      {t('diemCongTru.trangThai.mo')}
    </span>
  );
};

export default DiemCongTruTrangThaiBadge;
