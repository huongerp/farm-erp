import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn, formatDateShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { ThanhToanDoiTac } from '../core/types';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig } from '../../../../store/createGenericStore';

interface Props {
  data: ThanhToanDoiTac[];
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
  onEdit?: (item: ThanhToanDoiTac) => void;
  onDelete?: (id: string) => void;
  onView?: (item: ThanhToanDoiTac) => void;
}

const ThanhToanDoiTacList: React.FC<Props> = ({
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

  const renderStatusBadge = (item: ThanhToanDoiTac) => (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', !item.mau_trang_thai && 'bg-muted/50 text-muted-foreground border-border')}
      style={
        item.mau_trang_thai
          ? { backgroundColor: `${item.mau_trang_thai}20`, borderColor: item.mau_trang_thai, color: item.mau_trang_thai }
          : undefined
      }
    >
      {item.ten_trang_thai ?? '—'}
    </span>
  );

  const renderCell = (colId: string, item: ThanhToanDoiTac) => {
    switch (colId) {
      case 'so_phieu':
        return (
          <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            {item.so_phieu}
          </span>
        );
      case 'hang_muc_thanh_toan':
        return <span className="text-sm text-foreground truncate block">{item.hang_muc_thanh_toan}</span>;
      case 'ngay_xu_ly':
        return <span className="text-sm text-muted-foreground">{item.ngay_xu_ly ?? '—'}</span>;
      case 'ngay':
        return <span className="text-sm text-muted-foreground">{item.ngay}</span>;
      case 'ten_don_vi':
        return <span className="text-sm text-muted-foreground">{item.ten_don_vi ?? '—'}</span>;
      case 'ten_nhom':
        return <span className="text-sm text-muted-foreground">{item.ten_nhom ?? '—'}</span>;
      case 'ten_doi_tac':
        return <span className="text-sm text-muted-foreground">{item.ten_doi_tac ?? '—'}</span>;
      case 'ten_trang_thai':
        return renderStatusBadge(item);
      case 'so_tien':
        return (
          <span className="text-sm tabular-nums font-medium">
            {formatNumberVN(item.so_tien)}
          </span>
        );
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDateShort(item.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1.5 text-primary hover:bg-primary/10 rounded-md" title={t('common.edit')} aria-label={t('common.edit')}>
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
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

  const renderMobileCard = (item: ThanhToanDoiTac, isSelected: boolean) => (
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
        <div className="shrink-0">{renderStatusBadge(item)}</div>
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {formatYmdToDisplay(item.ngay)}
        {item.ngay_xu_ly ? ` · ${t('thanhToanDoiTac.store.ngayXuLyCol')}: ${formatYmdToDisplay(item.ngay_xu_ly)}` : ''}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">{item.hang_muc_thanh_toan}</p>
      {(item.ten_doi_tac || item.ten_nhom) && (
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {t('thanhToanDoiTac.store.doiTacCol')}: {[item.ten_doi_tac, item.ten_nhom].filter(Boolean).join(' · ')}
        </p>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {item.ten_don_vi ? `${t('thanhToanDoiTac.card.donViChi')}: ${item.ten_don_vi}` : ''}
        </span>
        <span className="shrink-0 tabular-nums">
          <span className="text-xs text-muted-foreground">{t('thanhToanDoiTac.store.soTienCol')}: </span>
          <span className="font-semibold">{formatNumberVN(item.so_tien)}</span>
        </span>
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
    <GenericTable<ThanhToanDoiTac>
      data={data}
      columns={visibleColumns}
      onResizeColumn={onResizeColumn}
      isLoading={isLoading}
      isFetching={isFetching}
      totalRecordsOverride={totalRecordsOverride}
      loadingText={t('thanhToanDoiTac.loading')}
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
      emptyTitle={t('thanhToanDoiTac.empty')}
      emptyDescription={t('thanhToanDoiTac.emptyHint')}
    />
  );
};

export default ThanhToanDoiTacList;
