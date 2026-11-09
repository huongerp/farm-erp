import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, Wrench } from 'lucide-react';
import { cn, getTodayISO } from '../../../../lib/utils';
import { tinhTrangHan } from '../core/han';
import type { ViecBaoDuong } from '../core/types';

interface Props {
  viec: ViecBaoDuong[];
  className?: string;
}

/** 3 thẻ số đầu trang: Quá hạn (đỏ), Sắp tới hạn ≤7 ngày (vàng), Tổng việc theo dõi (xanh lá). */
const StatsCards: React.FC<Props> = ({ viec, className }) => {
  const { t } = useTranslation();
  const homNay = getTodayISO();
  const dem = useMemo(() => {
    let quaHan = 0;
    let sapToi = 0;
    for (const v of viec) {
      const tt = tinhTrangHan(v.han_ke_tiep, homNay);
      if (tt === 'qua_han') quaHan += 1;
      else if (tt === 'sap_toi') sapToi += 1;
    }
    return { quaHan, sapToi };
  }, [viec, homNay]);

  const cards = [
    { id: 'qua_han', label: t('baoDuongThietBi.stats.quaHan'), value: dem.quaHan, icon: AlertTriangle, bg: 'bg-rose-500/10', color: 'text-rose-600 dark:text-rose-400' },
    { id: 'sap_toi', label: t('baoDuongThietBi.stats.sapToi'), value: dem.sapToi, icon: Clock, bg: 'bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
    { id: 'tong', label: t('baoDuongThietBi.stats.tong'), value: viec.length, icon: Wrench, bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    // Điện thoại: 1 hàng 3 ô gọn (ẩn icon, chữ nhỏ) để không chiếm nửa màn hình.
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {cards.map((c) => (
        <div key={c.id} className="bg-card rounded-lg border border-border px-2 py-1.5 sm:p-3">
          <div className="flex items-center gap-2.5">
            <div className={cn('hidden sm:flex w-8 h-8 rounded-lg items-center justify-center shrink-0', c.bg)}>
              <c.icon size={15} className={c.color} />
            </div>
            <div className="min-w-0">
              <p className="text-2xs text-muted-foreground truncate">{c.label}</p>
              <span className="text-base sm:text-lg font-bold text-foreground tabular-nums leading-tight">{c.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
