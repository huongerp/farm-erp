import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import type { HangHoa } from '../core/types';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

/** Tổng định mức (sum ton_toi_thieu) và số kho có định mức, theo hang_hoa_id. */
export type DinhMucSummaryMap = Record<string, { tong: number; soKho: number }>;

interface Props {
  data: HangHoa[];
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
  onEdit?: (item: HangHoa) => void;
  onDelete?: (id: string) => void;
  onView?: (item: HangHoa) => void;
  /** Map hang_hoa_id -> { tong, soKho } để hiển thị cột Tổng định mức (tab Danh sách). */
  dinhMucSummaryMap?: DinhMucSummaryMap;
}

const DanhSachHangHoaList: React.FC<Props> = ({
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
  dinhMucSummaryMap,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const renderStatusBadge = (item: HangHoa) => (
    <span
      className={
        item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG
          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap'
          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap'
      }
    >
      {item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('hangHoa.active') : t('hangHoa.inactive')}
    </span>
  );

  const renderCell = (colId: string, item: HangHoa) => {
    switch (colId) {
      case 'thu_tu':
        return <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{item.thu_tu}</span>;
      case 'ma_hang_hoa':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border whitespace-nowrap">
            {item.ma_hang_hoa}
          </span>
        );
      case 'ten_hang_hoa':
        return (
          <span className="block truncate whitespace-nowrap font-medium text-foreground" title={item.ten_hang_hoa}>
            {item.ten_hang_hoa}
          </span>
        );
      case 'ten_danh_muc':
        return (
          <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.ten_danh_muc ?? ''}>
            {item.ten_danh_muc ?? '—'}
          </span>
        );
      case 'dvt':
        return <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.dvt ?? ''}>{item.dvt ?? '—'}</span>;
      case 'pham_cap':
        return (
          <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.pham_cap ?? undefined}>
            {item.pham_cap ?? '—'}
          </span>
        );
      case 'don_gia':
        return (
          <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
            {formatNumberVN(item.don_gia)}
          </span>
        );
      case 'mo_ta':
        return (
          <span className="block truncate whitespace-nowrap text-sm text-muted-foreground" title={item.mo_ta ?? undefined}>
            {item.mo_ta ?? '—'}
          </span>
        );
      case 'hinh_anh':
        return item.hinh_anh ? (
          <img
            src={item.hinh_anh}
            alt=""
            className="w-10 h-10 rounded-lg object-cover border border-border"
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case 'tong_dinh_muc': {
        const summary = dinhMucSummaryMap?.[item.id];
        return summary && summary.soKho > 0 ? (
          <span className="text-sm tabular-nums whitespace-nowrap" title={`${summary.soKho} kho`}>
            {formatNumberVN(summary.tong)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      case 'so_kho_dinh_muc': {
        const summary = dinhMucSummaryMap?.[item.id];
        const soKho = summary?.soKho ?? 0;
        return soKho > 0 ? (
          <span className="text-sm tabular-nums whitespace-nowrap">{soKho}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
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
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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

  const renderMobileCard = (item: HangHoa, isSelected: boolean) => (
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
        <h4 className="font-semibold text-foreground text-sm line-clamp-2 min-w-0">{item.ten_hang_hoa}</h4>
        <div className="shrink-0">{renderStatusBadge(item)}</div>
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        <span className="font-mono">{item.ma_hang_hoa}</span>
        {item.ten_danh_muc ? ` · ${item.ten_danh_muc}` : ''}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {[
            item.dvt ? `${t('hangHoa.store.unitCol')}: ${item.dvt}` : '',
            item.pham_cap ? `${t('hangHoa.store.phamCapCol')}: ${item.pham_cap}` : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        {item.don_gia != null && (
          <span className="shrink-0 tabular-nums">
            <span className="text-xs text-muted-foreground">{t('hangHoa.store.priceCol')}: </span>
            <span className="font-semibold">{formatNumberVN(item.don_gia)}</span>
          </span>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-3 mt-2.5 pt-2.5 border-t border-border">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="h-10 w-10 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              aria-label={t('common.edit')}
            >
              <Edit size={16} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
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
    <GenericTable<HangHoa>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('hangHoa.loading')}
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
      emptyTitle={t('hangHoa.empty')}
      emptyDescription={t('hangHoa.emptyHint')}
    />
  );
};

export default DanhSachHangHoaList;
