import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { DeXuatMuaHang } from '../core/types';
import { TRANG_THAI_DE_XUAT_MUA_HANG, getTrangThaiPhieuBadgeClass, trangThaiToI18nKey } from '../core/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: DeXuatMuaHang[];
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
  onEdit?: (item: DeXuatMuaHang) => void;
  onDelete?: (id: string) => void;
  onView?: (item: DeXuatMuaHang) => void;
  canEditItem?: (item: DeXuatMuaHang) => boolean;
  canDeleteItem?: (item: DeXuatMuaHang) => boolean;
  isOverdue?: (item: DeXuatMuaHang) => boolean;
  serverTotalCount?: number;
}

const DeXuatMuaHangList: React.FC<Props> = ({
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

  const renderStatusBadges = (item: DeXuatMuaHang) => (
    <div className="flex flex-wrap items-center gap-1">
      {TRANG_THAI_DE_XUAT_MUA_HANG.includes(item.trang_thai) && (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
            getTrangThaiPhieuBadgeClass(item.trang_thai),
          )}
        >
          {t(`deXuatMuaHang.status.${trangThaiToI18nKey(item.trang_thai)}`)}
        </span>
      )}
      {isOverdue?.(item) && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          {t('deXuatMuaHang.overdueWarning')}
        </span>
      )}
    </div>
  );

  const renderCell = (colId: string, item: DeXuatMuaHang) => {
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

  const renderMobileCard = (item: DeXuatMuaHang, isSelected: boolean) => {
    const coSua = !!onEdit && (!canEditItem || canEditItem(item));
    const coXoa = !!onDelete && (!canDeleteItem || canDeleteItem(item));
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView?.(item)}
        onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
        className={cn(
          'bg-card rounded-xl border p-3.5 shadow-sm transition-all',
          isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground text-sm font-mono truncate">{item.so_phieu}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
              {formatYmdToDisplay(item.ngay)}
              {item.ten_noi_de_xuat ? ` · ${item.ten_noi_de_xuat}` : ''}
            </p>
          </div>
          <div className="shrink-0">{renderStatusBadges(item)}</div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          {item.ten_nguoi_de_xuat && (
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{t('deXuatMuaHang.store.nguoiDeXuatCol')}</div>
              <div className="font-medium truncate">{item.ten_nguoi_de_xuat}</div>
            </div>
          )}
          {item.ngay_can && (
            <div>
              <div className="text-xs text-muted-foreground">{t('deXuatMuaHang.store.ngayCanCol')}</div>
              <div className="font-semibold tabular-nums">{formatYmdToDisplay(item.ngay_can)}</div>
            </div>
          )}
          <div>
            <div className="text-xs text-muted-foreground">{t('deXuatMuaHang.store.lineItemsCol')}</div>
            <div className="font-semibold tabular-nums">
              {formatNumberVN(item.tong_so_dong ?? 0, { maxFractionDigits: 0 })}
            </div>
          </div>
        </div>
        {item.ghi_chu && (
          <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
            <span className="text-muted-foreground">{t('deXuatMuaHang.store.notesCol')}: </span>
            {item.ghi_chu}
          </p>
        )}
        {(coSua || coXoa) && (
          <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
            {coSua && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
                className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            )}
            {coXoa && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item.id);
                }}
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
    <GenericTable<DeXuatMuaHang>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      loadingText={t('deXuatMuaHang.loading')}
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
      emptyTitle={t('deXuatMuaHang.empty')}
      emptyDescription={t('deXuatMuaHang.emptyHint')}
    />
  );
};

export default DeXuatMuaHangList;
