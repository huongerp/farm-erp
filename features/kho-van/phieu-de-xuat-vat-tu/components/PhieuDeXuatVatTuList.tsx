import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN } from '../../../../lib/utils';
import type { PhieuDeXuatVatTu } from '../core/types';
import { TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_DUYET, TRANG_THAI_KHONG_DUYET } from '../core/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: PhieuDeXuatVatTu[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: PhieuDeXuatVatTu) => void;
  onDelete?: (id: string) => void;
  onView?: (item: PhieuDeXuatVatTu) => void;
  canEditItem?: (item: PhieuDeXuatVatTu) => boolean;
  canDeleteItem?: (item: PhieuDeXuatVatTu) => boolean;
  isOverdue?: (item: PhieuDeXuatVatTu) => boolean;
}

const PhieuDeXuatVatTuList: React.FC<Props> = ({
  data,
  columns,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onView,
  canEditItem,
  canDeleteItem,
  isOverdue,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderStatusBadges = (item: PhieuDeXuatVatTu) => (
    <div className="flex flex-wrap items-center gap-1">
      {item.trang_thai === TRANG_THAI_CHO_DUYET && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {t('phieuDeXuatVatTu.status.pending')}
        </span>
      )}
      {item.trang_thai === TRANG_THAI_DA_DUYET && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          {t('phieuDeXuatVatTu.status.approved')}
        </span>
      )}
      {item.trang_thai === TRANG_THAI_KHONG_DUYET && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          {t('phieuDeXuatVatTu.status.rejected')}
        </span>
      )}
      {isOverdue?.(item) && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          {t('phieuDeXuatVatTu.overdueWarning')}
        </span>
      )}
    </div>
  );

  const renderCell = (colId: string, item: PhieuDeXuatVatTu) => {
    switch (colId) {
      case 'so_phieu':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.so_phieu}
          </span>
        );
      case 'ngay':
        return <span className="text-sm text-muted-foreground">{item.ngay}</span>;
      case 'ngay_can':
        return <span className="text-sm text-muted-foreground">{item.ngay_can}</span>;
      case 'ten_noi_de_xuat':
        return <span className="text-sm text-muted-foreground">{item.ten_noi_de_xuat ?? '—'}</span>;
      case 'ten_nguoi_de_xuat':
        return <span className="text-sm text-muted-foreground">{item.ten_nguoi_de_xuat ?? '—'}</span>;
      case 'ten_nguoi_duyet':
        return <span className="text-sm text-muted-foreground">{item.ten_nguoi_duyet ?? '—'}</span>;
      case 'tong_so_dong':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatNumberVN(item.tong_so_dong ?? 0, { maxFractionDigits: 0 })}
          </span>
        );
      case 'tong_so_luong':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatNumberVN(item.tong_so_luong ?? 0)}
          </span>
        );
      case 'ghi_chu':
        return <span className="text-xs text-muted-foreground line-clamp-2">{item.ghi_chu ?? '—'}</span>;
      case 'tg_tao':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_tao)}</span>;
      case 'trang_thai':
        return renderStatusBadges(item);
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (!canEditItem || canEditItem(item)) && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1.5 text-primary hover:bg-primary/10 rounded-md" title={t('common.edit')} aria-label={t('common.edit')}>
                <Edit size={14} />
              </button>
            )}
            {onDelete && (!canDeleteItem || canDeleteItem(item)) && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md" title={t('common.delete')} aria-label={t('common.delete')}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: PhieuDeXuatVatTu, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      className={cn(
        'bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]',
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
          {item.so_phieu}
        </span>
        {renderStatusBadges(item)}
      </div>
      <div className="text-xs text-muted-foreground mb-1">{item.ngay} · {item.ten_noi_de_xuat ?? '—'}</div>
      <div className="text-sm text-foreground mb-1">{item.ten_nguoi_de_xuat ?? '—'}</div>
      <div className="text-xs text-muted-foreground tabular-nums mb-1">
        {t('phieuDeXuatVatTu.store.lineItemsCol')}: {formatNumberVN(item.tong_so_dong ?? 0, { maxFractionDigits: 0 })} · {t('phieuDeXuatVatTu.store.totalQuantityCol')}: {formatNumberVN(item.tong_so_luong ?? 0)}
      </div>
      {item.ghi_chu && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.ghi_chu}</p>}
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>
        <div className="flex gap-1">
          {onEdit && (!canEditItem || canEditItem(item)) && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
              <Edit size={14} />
            </button>
          )}
          {onDelete && (!canDeleteItem || canDeleteItem(item)) && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg" aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable<PhieuDeXuatVatTu>
      data={data}
      columns={visibleColumns}
      isLoading={isLoading}
      loadingText={t('phieuDeXuatVatTu.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('phieuDeXuatVatTu.empty')}
      emptyDescription={t('phieuDeXuatVatTu.emptyHint')}
    />
  );
};

export default PhieuDeXuatVatTuList;
