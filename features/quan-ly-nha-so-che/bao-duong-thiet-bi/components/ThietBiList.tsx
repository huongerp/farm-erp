import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import { cn } from '../../../../lib/utils';
import type { ThietBiRow } from '../core/list-types';

interface Props {
  data: ThietBiRow[];
  columns: ColumnConfig[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalRecordsOverride: number;
  sort?: SortState;
  onSort?: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  onResizeColumn?: (id: string, width: number) => void;
  onView: (item: ThietBiRow) => void;
  onEdit?: (item: ThietBiRow) => void;
  onDelete?: (item: ThietBiRow) => void;
}

const ThietBiList: React.FC<Props> = ({
  data,
  columns,
  isLoading,
  isFetching,
  isError,
  onRetry,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalRecordsOverride,
  sort,
  onSort,
  onResizeColumn,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  const renderCell = (colId: string, item: ThietBiRow) => {
    const one = (text: React.ReactNode, className?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)}>{text}</span>
    );
    switch (colId) {
      case 'ten':
        return one(item.ten, 'font-medium');
      case 'ma_ts':
        return one(item.ma_ts || '—', 'font-mono text-muted-foreground');
      case 'so_luong':
        return one(item.so_luong || '—', 'text-muted-foreground');
      case 'khu_vuc':
        return one(item.khu_vuc || '—', 'text-muted-foreground');
      case 'tai_san':
        return one(item.tai_san_ma ? `${item.tai_san_ma} — ${item.tai_san_ten ?? ''}` : '—', 'text-muted-foreground');
      case 'dang_dung':
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
              item.dang_dung
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {item.dang_dung ? t('baoDuongThietBi.thietBi.dangDung') : t('baoDuongThietBi.thietBi.ngungDung')}
          </span>
        );
      case 'thu_tu':
        return one(item.thu_tu, 'tabular-nums text-muted-foreground');
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
                  onDelete(item);
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

  const renderMobileCard = (item: ThietBiRow, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView(item)}
      className={cn('bg-card rounded-xl border p-3.5 shadow-sm transition-all', isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold truncate">{item.ten}</h4>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{item.ma_ts || '—'}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {[item.khu_vuc, item.tai_san_ma].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
              item.dang_dung
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {item.dang_dung ? t('baoDuongThietBi.thietBi.dangDung') : t('baoDuongThietBi.thietBi.ngungDung')}
          </span>
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="mt-2 flex items-center justify-end gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
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
                onDelete(item);
              }}
              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericTable<ThietBiRow>
      data={data}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={onRetry}
      selectedIds={selectedIds}
      onToggleSelection={onToggleSelection}
      onToggleAll={onToggleAllSelection}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      totalRecordsOverride={totalRecordsOverride}
      sort={sort}
      onSort={onSort}
      onResizeColumn={onResizeColumn}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      onRowClick={onView}
      keyExtractor={(item) => item.id}
      loadingText={t('baoDuongThietBi.loading')}
      emptyTitle={t('baoDuongThietBi.empty')}
      emptyDescription={t('baoDuongThietBi.thietBi.emptyHint')}
    />
  );
};

export default ThietBiList;
