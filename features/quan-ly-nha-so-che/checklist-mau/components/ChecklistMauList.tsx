import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Printer, Trash2 } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { cn } from '../../../../lib/utils';
import type { ColumnConfig, SortState } from '../../../../store/createGenericStore';
import type { MauChecklistListItem } from '../core/list-types';

interface Props {
  data: MauChecklistListItem[];
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
  onRowClick?: (item: MauChecklistListItem) => void;
  onEdit?: (item: MauChecklistListItem) => void;
  onDelete?: (item: MauChecklistListItem) => void;
  onPrint?: (item: MauChecklistListItem) => void;
}

const Badge: React.FC<{ on: boolean; yes: string; no: string }> = ({ on, yes, no }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
      on ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
    )}
  >
    {on ? yes : no}
  </span>
);

const ChecklistMauList: React.FC<Props> = ({
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
  onRowClick,
  onEdit,
  onDelete,
  onPrint,
}) => {
  const { t } = useTranslation();

  const renderCell = (colId: string, item: MauChecklistListItem) => {
    const one = (text: React.ReactNode, className?: string) => (
      <span className={cn('block truncate whitespace-nowrap text-sm', className)}>{text}</span>
    );
    switch (colId) {
      case 'ma':
        return one(item.ma || '—', 'font-mono text-muted-foreground');
      case 'ten':
        return one(item.ten, 'font-medium');
      case 'loai':
        return one(t(`checklistMau.loai.${item.loai}`));
      case 'dang_dung':
        return <Badge on={item.dang_dung} yes={t('checklistMau.dangDung')} no={t('checklistMau.ngungDung')} />;
      case 'thu_tu':
        return one(item.thu_tu, 'tabular-nums text-muted-foreground');
      case 'so_muc':
        return one(item.so_muc, 'tabular-nums text-muted-foreground');
      case 'so_hang_muc':
        return one(item.so_hang_muc, 'tabular-nums text-muted-foreground');
      case 'actions':
        return (
          <div className="flex items-center justify-end gap-0.5">
            {onPrint && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint(item);
                }}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md"
                title={t('checklistMau.hanhDong.inMauTrang')}
                aria-label={t('checklistMau.hanhDong.inMauTrang')}
              >
                <Printer size={14} />
              </button>
            )}
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

  const renderMobileCard = (item: MauChecklistListItem, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(item)}
      className={cn(
        'bg-card rounded-xl border p-3.5 shadow-sm transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold truncate">{item.ten}</h4>
          <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{item.ma || '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('checklistMau.col.soMuc')}: {item.so_muc} · {t('checklistMau.col.soHangMuc')}: {item.so_hang_muc}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge on={item.dang_dung} yes={t('checklistMau.dangDung')} no={t('checklistMau.ngungDung')} />
          <span className="text-xs text-muted-foreground">{t(`checklistMau.loai.${item.loai}`)}</span>
        </div>
      </div>
      {(onEdit || onDelete || onPrint) && (
        <div className="mt-2 flex items-center justify-end gap-1">
          {onPrint && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(item);
              }}
              className="p-1.5 text-muted-foreground hover:bg-muted rounded-md"
              aria-label={t('checklistMau.hanhDong.inMauTrang')}
            >
              <Printer size={14} />
            </button>
          )}
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
    <GenericTable<MauChecklistListItem>
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
      onRowClick={onRowClick}
      keyExtractor={(item) => item.id}
      loadingText={t('checklistMau.loading')}
      emptyTitle={t('checklistMau.empty')}
      emptyDescription={t('checklistMau.emptyHint')}
    />
  );
};

export default ChecklistMauList;
