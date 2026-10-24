import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { PhieuDeXuatVatTu } from '../core/types';
import { TRANG_THAI_PHIEU_DE_XUAT_VAT_TU, getTrangThaiPhieuBadgeClass, trangThaiToI18nKey } from '../core/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: PhieuDeXuatVatTu[];
  columns: ColumnConfig[];
  /** Cho phép kéo đổi bề rộng cột — truyền `resizeColumn` của store. */
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  isFetching?: boolean;
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
  serverTotalCount?: number;
}

const PhieuDeXuatVatTuList: React.FC<Props> = ({
  data,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  isFetching,
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
  serverTotalCount,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderStatusBadges = (item: PhieuDeXuatVatTu) => (
    <div className="flex flex-wrap items-center gap-1">
      {TRANG_THAI_PHIEU_DE_XUAT_VAT_TU.includes(item.trang_thai) && (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
            getTrangThaiPhieuBadgeClass(item.trang_thai),
          )}
        >
          {t(`phieuDeXuatVatTu.status.${trangThaiToI18nKey(item.trang_thai)}`)}
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
        return <span className="text-sm text-muted-foreground whitespace-nowrap">{item.ngay}</span>;
      case 'ngay_can':
        return <span className="text-sm text-muted-foreground whitespace-nowrap">{item.ngay_can}</span>;
      case 'ten_noi_de_xuat':
        return <span className="text-sm text-muted-foreground whitespace-nowrap">{item.ten_noi_de_xuat ?? '—'}</span>;
      case 'ten_nguoi_de_xuat':
        return <span className="text-sm text-muted-foreground whitespace-nowrap">{item.ten_nguoi_de_xuat ?? '—'}</span>;
      case 'ten_nguoi_duyet':
        return <span className="text-sm text-muted-foreground whitespace-nowrap">{item.ten_nguoi_duyet ?? '—'}</span>;
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
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis block max-w-full" title={item.ghi_chu ?? ''}>
            {item.ghi_chu ?? '—'}
          </span>
        );
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

  const renderMobileCard = (item: PhieuDeXuatVatTu, isSelected: boolean) => {
    const coSuaDuoc = !!onEdit && (!canEditItem || canEditItem(item));
    const coXoaDuoc = !!onDelete && (!canDeleteItem || canDeleteItem(item));
    return (
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
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-foreground text-sm truncate min-w-0">{item.so_phieu}</h4>
          <div className="shrink-0">{renderStatusBadges(item)}</div>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {formatYmdToDisplay(item.ngay)}
          {item.ten_noi_de_xuat ? ` · ${item.ten_noi_de_xuat}` : ''}
        </p>
        <p className="mt-2 text-sm text-foreground tabular-nums">
          <span className="text-muted-foreground">{t('phieuDeXuatVatTu.store.ngayCanCol')}: </span>
          <span className="font-semibold">{formatYmdToDisplay(item.ngay_can)}</span>
        </p>
        <div className="mt-1 flex items-center justify-between gap-2 text-sm">
          <span className="min-w-0 truncate text-foreground/80">
            <span className="text-muted-foreground">{t('phieuDeXuatVatTu.store.nguoiDeXuatCol')}: </span>
            {item.ten_nguoi_de_xuat ?? '—'}
          </span>
          <span className="shrink-0 tabular-nums">
            <span className="text-xs text-muted-foreground">{t('phieuDeXuatVatTu.store.lineItemsCol')}: </span>
            <span className="font-semibold">{formatNumberVN(item.tong_so_dong ?? 0, { maxFractionDigits: 0 })}</span>
          </span>
        </div>
        {item.ghi_chu && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{item.ghi_chu}</p>}
        {(coSuaDuoc || coXoaDuoc) && (
          <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
            {coSuaDuoc && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            )}
            {coXoaDuoc && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
                className="h-10 w-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <GenericTable<PhieuDeXuatVatTu>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      loadingText={t('phieuDeXuatVatTu.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      totalRecordsOverride={serverTotalCount}
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
