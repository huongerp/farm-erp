import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import type { NhatKyPhaPhenLanRow } from '../core/types';
import { formatChenhLechLan, formatKg, mauChenhLech } from '../utils/hien-thi';

interface Props {
  item: NhatKyPhaPhenLanRow;
  isSelected: boolean;
  onView: (item: NhatKyPhaPhenLanRow) => void;
}

/** Thẻ mobile một lần pha. */
const ChiTietCard: React.FC<Props> = ({ item, isSelected, onView }) => {
  const { t } = useTranslation();
  const nhan = (label: string, value: React.ReactNode, className?: string) => (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-medium truncate tabular-nums', className)}>{value}</div>
    </div>
  );
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView(item)}
      className={cn(
        'bg-card rounded-xl border p-3.5 shadow-sm transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold truncate min-w-0">
          {formatYmdToDisplay(item.ngay)}
          {item.ten_chi_nhanh ? ` · ${item.ten_chi_nhanh}` : ''}
        </h4>
        <span className="shrink-0 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5 tabular-nums">
          {t('nkpp.chiTiet.lanThu', { lan: item.lan })}
          {item.gio ? ` · ${item.gio}` : ''}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5">
        {nhan(t('nkpp.chiTiet.col.soKg'), formatKg(item.so_kg))}
        {nhan(t('nkpp.col.dinhMuc'), formatKg(item.dinh_muc_kg))}
        {nhan(t('nkpp.col.chenhLech'), formatChenhLechLan(item.chenh_lech), mauChenhLech(item.chenh_lech))}
      </div>
      {item.ten_nhan_vien_phu_trach && (
        <p className="text-xs text-muted-foreground mt-1.5 truncate">{item.ten_nhan_vien_phu_trach}</p>
      )}
    </div>
  );
};

export default ChiTietCard;
