import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ColumnConfig } from '../../store/createGenericStore';
import { resolveAutoFitWidth } from '../../lib/table-core/column-autofit';
import { useAutoFitColumns } from '../../lib/table-core/use-auto-fit-columns';
import ColumnResizeHandle from './column-header/ColumnResizeHandle';

/** Bề rộng cột checkbox và cột Thao tác (px) — khớp với <colgroup>. */
const CHECKBOX_WIDTH = 44;
const ACTIONS_WIDTH = 80;

export interface HierarchyTableProps<T> {
  /** Dữ liệu đã flatten + đã paginate (một trang) */
  data: T[];
  /** Cột hiển thị (đã filter visible, sort order) */
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  getId: (item: T) => string;
  /** Level/cấp (1 = root) để style hàng */
  getLevel: (item: T) => number;
  /** Render ô theo cột */
  renderCell: (item: T, col: ColumnConfig) => React.ReactNode;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
  /** Label cột "Thao tác" */
  actionsColumnLabel?: string;
  /** Class cho container scroll */
  className?: string;
  /** Cho phép kéo đổi bề rộng cột — truyền `resizeColumn` của store. */
  onResizeColumn?: (id: string, width: number) => void;
}

/**
 * Bảng desktop hiển thị danh sách dạng cây: cột checkbox, các cột data (renderCell),
 * cột thao tác. Hàng root (level 1) có nền khác, click hàng = onView.
 */
export function HierarchyTable<T>({
  data,
  columns,
  selectedIds,
  getId,
  getLevel,
  renderCell,
  onToggleSelection,
  onToggleAllSelection,
  onEdit,
  onDelete,
  onView,
  actionsColumnLabel,
  className,
  onResizeColumn,
}: HierarchyTableProps<T>) {
  const { t } = useTranslation();
  const currentPageIds = data.map(getId);
  const isAllSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const isIndeterminate =
    currentPageIds.some((id) => selectedIds.has(id)) && !isAllSelected;
  const actionsLabel = actionsColumnLabel ?? t('common.actions');
  const { autoWidths, setHeaderCellRef } = useAutoFitColumns(
    data.length > 0,
    columns.map((c) => c.id).join('|')
  );
  const columnWidths = React.useMemo(
    () => columns.map((col) => resolveAutoFitWidth(col, autoWidths.get(col.id))),
    [columns, autoWidths]
  );
  const tableMinWidth = React.useMemo(
    () => CHECKBOX_WIDTH + columnWidths.reduce((sum, w) => sum + w, 0) + ACTIONS_WIDTH,
    [columnWidths]
  );

  return (
    <div
      className={cn(
        'flex-1 min-h-0 overflow-auto custom-scrollbar',
        className
      )}
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* `table-layout: fixed` + <colgroup>: xem chú thích trong GenericTable —
          không có nó thì kéo cột sẽ "không ăn". */}
      <table
        className="text-sm text-left border-separate border-spacing-0"
        style={{ width: '100%', minWidth: tableMinWidth, tableLayout: 'fixed' }}
      >
        <colgroup>
          <col style={{ width: CHECKBOX_WIDTH }} />
          {columns.map((col, index) => (
            <col key={col.id} style={{ width: columnWidths[index] }} />
          ))}
          <col />
          <col style={{ width: ACTIONS_WIDTH }} />
        </colgroup>
        <thead className="sticky top-0 z-[2]">
          <tr className="bg-muted border-b border-border">
            <th
              className="sticky left-0 z-[3] w-11 px-2 py-1.5 bg-muted border-b border-r border-border text-center"
              style={{ minWidth: 44, maxWidth: 44 }}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={() => onToggleAllSelection(currentPageIds)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-border text-primary accent-primary"
                aria-label={t('common.selectAll')}
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                ref={(el) => setHeaderCellRef(col.id, el)}
                className="relative px-3 py-1.5 font-semibold text-foreground/80 border-b border-border text-xs whitespace-nowrap min-w-0"
              >
                {col.label}
                <ColumnResizeHandle col={col} onResizeColumn={onResizeColumn} />
              </th>
            ))}
            {/* Cột đệm: nuốt phần dư khi khung rộng hơn tổng bề rộng cột. */}
            <th className="bg-muted border-b border-border" aria-hidden />
            <th className="sticky right-0 z-[3] px-2 py-1.5 bg-muted border-b border-l border-border text-center font-semibold text-foreground/80 text-xs">
              {actionsLabel}
            </th>
          </tr>
        </thead>
        <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
          {data.map((item) => {
            const id = getId(item);
            const level = getLevel(item);
            const isRoot = level === 1;
            const isSelected = selectedIds.has(id);
            return (
              <tr
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => onView?.(item)}
                onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
                className={cn(
                  'group transition-all hover:bg-muted/80 cursor-pointer',
                  isRoot ? 'bg-muted/40' : 'bg-card',
                  isSelected && 'bg-primary/5'
                )}
              >
                <td
                  className={cn(
                    'sticky left-0 z-[1] w-11 px-2 py-1.5 text-center border-r border-border transition-colors',
                    isRoot ? 'bg-muted/40' : 'bg-card',
                    isSelected && 'bg-primary/5',
                    'group-hover:bg-muted/80'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(id)}
                    className="w-4 h-4 rounded border-border text-primary accent-primary"
                    aria-label={t('common.select')}
                  />
                </td>
                {columns.map((col) => renderCell(item, col))}
                <td aria-hidden />
                <td
                  className={cn(
                    'sticky right-0 z-[1] px-2 py-1.5 border-l border-border text-center transition-colors',
                    isRoot ? 'bg-muted/40' : 'bg-card',
                    isSelected && 'bg-primary/5',
                    'group-hover:bg-muted/80'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-0.5">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-md transition-all active:scale-95"
                        title={t('common.edit')}
                      >
                        <Edit size={15} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all active:scale-95"
                        title={t('common.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default HierarchyTable;
