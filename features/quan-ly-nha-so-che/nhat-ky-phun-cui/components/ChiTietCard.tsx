import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import { donViLuongThuoc } from '../core/constants';
import { formatSo } from '../core/so';
import type { NhatKyPhunCuiLanRow } from '../core/types';

interface Props {
  item: NhatKyPhunCuiLanRow;
  isSelected: boolean;
  onView: (item: NhatKyPhunCuiLanRow) => void;
}

/** Thẻ mobile một lần pha. */
const ChiTietCard: React.FC<Props> = ({ item, isSelected, onView }) => {
  const { t } = useTranslation();
  const nhan = (label: string, value: React.ReactNode) => (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate tabular-nums">{value || '—'}</div>
    </div>
  );
  const thuoc = [item.ma_hang_hoa, item.ten_hang_hoa].filter(Boolean).join(' · ');
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
          {t('nkpc.chiTiet.lanThu', { lan: item.thu_tu })}
          {item.gio ? ` · ${item.gio}` : ''}
        </span>
      </div>
      <p className="text-sm mt-1.5 truncate">{thuoc || '—'}</p>
      <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5">
        {nhan(t('nkpc.chiTiet.col.nongDo'), item.nong_do != null ? `${formatSo(item.nong_do)} ${item.don_vi}` : '')}
        {nhan(t('nkpc.chiTiet.col.luongNuoc'), formatSo(item.luong_nuoc_lit))}
        {nhan(
          t('nkpc.chiTiet.col.luongThuoc'),
          item.luong_thuoc != null ? `${formatSo(item.luong_thuoc)} ${donViLuongThuoc(item.don_vi)}` : ''
        )}
      </div>
      {item.ten_nhan_vien_phu_trach && (
        <p className="text-xs text-muted-foreground mt-1.5 truncate">{item.ten_nhan_vien_phu_trach}</p>
      )}
    </div>
  );
};

export default ChiTietCard;
