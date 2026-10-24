import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { HopDong } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: HopDong[];
  columns: ColumnConfig[];
  /** Cho phép kéo đổi bề rộng cột — truyền `resizeColumn` của store. */
  onResizeColumn?: (id: string, width: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  /** Đang tải trang mới nhưng đã có dữ liệu cũ — hiện lớp phủ mờ thay vì skeleton. */
  isFetching?: boolean;
  /** Tổng số bản ghi khớp bộ lọc (phân trang ở server). */
  totalRecordsOverride?: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: HopDong) => void;
  onDelete?: (id: string) => void;
  onView?: (item: HopDong) => void;
}

const HopDongList: React.FC<Props> = ({
  data,
  isFetching,
  totalRecordsOverride,
  columns,
  onResizeColumn,
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
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderStatus = (item: HopDong) => (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        item.trang_thai === 'Đã thanh lý'
          ? 'bg-muted/50 text-muted-foreground border-border'
          : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30'
      )}
    >
      {item.trang_thai === 'Đã thanh lý' ? t('hopDong.trangThai.daThanhLy') : t('hopDong.trangThai.dangThucHien')}
    </span>
  );

  const renderCell = (colId: string, item: HopDong) => {
    switch (colId) {
      case 'ma_hop_dong':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.ma_hop_dong}
          </span>
        );
      case 'ten_hop_dong':
        return (
          <span className="text-sm text-foreground truncate block min-w-0" title={item.ten_hop_dong ?? undefined}>
            {item.ten_hop_dong ?? '—'}
          </span>
        );
      case 'ngay':
        return <span className="text-sm text-muted-foreground whitespace-nowrap">{item.ngay ?? '—'}</span>;
      case 'ten_nha_cung_cap':
        return (
          <span className="text-sm text-muted-foreground truncate block min-w-0" title={item.ten_nha_cung_cap ?? undefined}>
            {item.ten_nha_cung_cap ?? '—'}
          </span>
        );
      case 'thanh_tien':
        return (
          <span className="text-sm tabular-nums font-medium">
            {formatNumberVN(item.thanh_tien)}
          </span>
        );
      case 'so_luong_cay':
        return (
          <span className="text-sm tabular-nums">
            {formatNumberVN(Number(item.so_luong_cay))}
          </span>
        );
      case 'tong_da_thanh_toan':
        return (
          <span className="text-sm tabular-nums font-medium">
            {formatNumberVN(item.tong_da_thanh_toan)}
          </span>
        );
      case 'so_dot_thanh_toan':
        return (
          <span className="text-sm tabular-nums text-center inline-block w-full">
            {item.so_dot_thanh_toan != null ? String(item.so_dot_thanh_toan) : '—'}
          </span>
        );
      case 'tong_cay_da_giao':
        return (
          <span className="text-sm tabular-nums">
            {formatNumberVN(Number(item.tong_cay_da_giao))}
          </span>
        );
      case 'tien_con_lai':
        return (
          <span
            className={cn(
              'text-sm tabular-nums font-medium',
              item.tien_con_lai != null && item.tien_con_lai < 0 && 'text-rose-600'
            )}
          >
            {formatNumberVN(item.tien_con_lai)}
          </span>
        );
      case 'cay_con_lai':
        return (
          <span
            className={cn(
              'text-sm tabular-nums',
              item.cay_con_lai != null && Number(item.cay_con_lai) < 0 && 'text-rose-600'
            )}
          >
            {formatNumberVN(Number(item.cay_con_lai))}
          </span>
        );
      case 'hinh_anh': {
        const urls = item.hinh_anh_urls ?? [];
        if (urls.length === 0) {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
        return (
          <div className="relative inline-block">
            <img
              src={urls[0]}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              className="rounded border border-border object-cover h-10 w-10"
            />
            {urls.length > 1 && (
              <span className="absolute -top-1 -right-1 px-1.5 rounded-full bg-primary text-white text-2xs font-medium leading-4 min-w-[16px] text-center">
                {urls.length}
              </span>
            )}
          </div>
        );
      }
      case 'trang_thai':
        return renderStatus(item);
      case 'ten_nguoi_tao':
        return <span className="text-sm text-muted-foreground">{item.ten_nguoi_tao ?? '—'}</span>;
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
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

  const renderMobileCard = (item: HopDong, isSelected: boolean) => (
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
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">{item.ma_hop_dong}</h4>
          {item.ten_hop_dong && <p className="text-sm text-foreground/80 truncate">{item.ten_hop_dong}</p>}
        </div>
        <div className="shrink-0">{renderStatus(item)}</div>
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {item.ngay ? formatYmdToDisplay(item.ngay) : '—'}
        {item.ten_nha_cung_cap ? ` · ${item.ten_nha_cung_cap}` : ''}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 tabular-nums">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">{t('hopDong.store.thanhTienCol')}</dt>
          <dd className="text-sm font-semibold truncate">{formatNumberVN(item.thanh_tien)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">{t('hopDong.store.tongDaThanhToanCol')}</dt>
          <dd className="text-sm font-semibold truncate">{formatNumberVN(item.tong_da_thanh_toan)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">{t('hopDong.store.tienConLaiCol')}</dt>
          <dd
            className={cn(
              'text-sm font-semibold truncate',
              item.tien_con_lai != null && item.tien_con_lai < 0 && 'text-rose-600'
            )}
          >
            {formatNumberVN(item.tien_con_lai)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">{t('hopDong.store.cayConLaiCol')}</dt>
          <dd
            className={cn(
              'text-sm font-semibold truncate',
              item.cay_con_lai != null && Number(item.cay_con_lai) < 0 && 'text-rose-600'
            )}
          >
            {formatNumberVN(Number(item.cay_con_lai))}
          </dd>
        </div>
      </dl>
      <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
        {t('hopDong.store.soLuongCayCol')}: {formatNumberVN(Number(item.so_luong_cay))} · {t('hopDong.store.tongCayDaGiaoCol')}:{' '}
        {formatNumberVN(Number(item.tong_cay_da_giao))}
      </p>
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              aria-label={t('common.edit')}
            >
              <Edit size={16} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
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

  return (
    <GenericTable<HopDong>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('hopDong.loading')}
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
      emptyTitle={t('hopDong.empty')}
      emptyDescription={t('hopDong.emptyHint')}
    />
  );
};

export default HopDongList;
