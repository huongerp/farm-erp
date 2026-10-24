import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import { cn, formatYmdToDisplay } from '../../../../lib/utils';
import type { GiamSatChatLuong } from '../core/types';
import { KetLuanBadge, TrangThaiBadge } from './Badges';

interface Props {
  data: GiamSatChatLuong[];
  columns: ColumnConfig[];
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  isFetching?: boolean;
  totalRecordsOverride?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  onView: (item: GiamSatChatLuong) => void;
  onEdit?: (item: GiamSatChatLuong) => void;
  onDelete?: (id: string) => void;
}

const TienDo: React.FC<{ item: GiamSatChatLuong }> = ({ item }) => {
  const du = item.so_thung_da_kiem >= item.so_thung_mau;
  const pct = item.so_thung_mau ? Math.min(100, (item.so_thung_da_kiem / item.so_thung_mau) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={cn('tabular-nums text-sm font-medium', du && 'text-emerald-600 dark:text-emerald-400')}>
        {item.so_thung_da_kiem}/{item.so_thung_mau}
      </span>
      <span className="hidden md:block h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <span
          className={cn('block h-full rounded-full', du ? 'bg-emerald-500' : 'bg-amber-500')}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
};

const GiamSatChatLuongList: React.FC<Props> = ({
  data,
  columns,
  onResizeColumn,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  isFetching,
  totalRecordsOverride,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
  onSort,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderCell = (colId: string, item: GiamSatChatLuong) => {
    const one = (text: React.ReactNode, className?: string, title?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)} title={title}>
        {text}
      </span>
    );
    switch (colId) {
      case 'so_phieu':
        return one(item.so_phieu, 'font-mono font-medium');
      case 'ngay':
        return one(formatYmdToDisplay(item.ngay), 'tabular-nums');
      case 'trang_thai':
        return <TrangThaiBadge value={item.trang_thai} />;
      case 'ket_luan':
        return <KetLuanBadge value={item.ket_luan} />;
      case 'tien_do':
        return <TienDo item={item} />;
      case 'ten_hang_hoa':
        return one(item.ten_hang_hoa || '—', undefined, item.ten_hang_hoa ?? undefined);
      case 'ma_cay_hang':
        return one(item.ma_cay_hang || '—', 'font-mono');
      case 'so_thung_cay':
        return one(item.so_thung_cay, 'tabular-nums');
      case 'ten_chi_nhanh':
        return one(item.ten_chi_nhanh || '—', 'text-muted-foreground');
      case 'ghi_chu':
        return one(item.ghi_chu || '—', 'text-muted-foreground', item.ghi_chu ?? undefined);
      case 'ten_nguoi_tao':
        return one(item.ten_nguoi_tao || '—', 'text-muted-foreground');
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                title={t('common.edit')}
                aria-label={t('common.edit')}
              >
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                title={t('common.delete')}
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: GiamSatChatLuong, isSelected: boolean) => {
    const du = item.so_thung_da_kiem >= item.so_thung_mau;
    const pct = item.so_thung_mau ? Math.min(100, (item.so_thung_da_kiem / item.so_thung_mau) * 100) : 0;
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
          <div className="min-w-0">
            <h4 className="text-sm font-semibold truncate">{item.ten_hang_hoa || '—'}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
              {formatYmdToDisplay(item.ngay)}
              {item.ten_chi_nhanh ? ` · ${item.ten_chi_nhanh}` : ''}
            </p>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
              {item.so_phieu}
              {item.ma_cay_hang ? ` · ${item.ma_cay_hang}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <TrangThaiBadge value={item.trang_thai} />
            {item.ket_luan && <KetLuanBadge value={item.ket_luan} />}
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-xs text-muted-foreground">{t('giamSatChatLuong.card.daKiem')}</span>
            <span
              className={cn('tabular-nums font-semibold', du && 'text-emerald-600 dark:text-emerald-400')}
            >
              {t('giamSatChatLuong.card.daKiemGiaTri', { da: item.so_thung_da_kiem, mau: item.so_thung_mau })}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full', du ? 'bg-emerald-500' : 'bg-amber-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t('giamSatChatLuong.card.thungMoiCay')}:{' '}
            <span className="font-medium text-foreground tabular-nums">{item.so_thung_cay}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <GenericTable<GiamSatChatLuong>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('giamSatChatLuong.loading')}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sort={sort}
      onSort={onSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      emptyTitle={t('giamSatChatLuong.empty')}
      emptyDescription={t('giamSatChatLuong.emptyHint')}
    />
  );
};

export default GiamSatChatLuongList;
