import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ColumnConfig } from '../../store/createGenericStore';
import { getColumnCellStyle } from '../../store/createGenericStore';

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
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onView?: (item: T) => void;
  /** Label cột "Thao tác" */
  actionsColumnLabel?: string;
  /** Class cho container scroll */
  className?: string;
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
}: HierarchyTableProps<T>) {
  const { t } = useTranslation();
  const currentPageIds = data.map(getId);
  const isAllSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const isIndeterminate =
    currentPageIds.some((id) => selectedIds.has(id)) && !isAllSelected;
  const actionsLabel = actionsColumnLabel ?? t('common.actions');

  return (
    <div
      className={cn(
        'flex-1 min-h-0 overflow-auto custom-scrollbar',
        className
      )}
      style={{ overscrollBehavior: 'contain' }}
    >
      <table className="w-full text-sm text-left border-separate border-spacing-0">
        <thead className="sticky top-0 z-[2]">
          <tr className="bg-muted border-b border-border">
            <th
              className="sticky left-0 z-[3] w-11 px-3 py-2 bg-muted border-b border-r border-border text-center"
              style={{ minWidth: 44, maxWidth: 44 }}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => el && (el.indeterminate = isIndeterminate)}
                onChange={() => onToggleAllSelection(currentPageIds)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-border text-primary accent-primary"
                aria-label={t('common.selectAll')}
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-4 py-2 font-semibold text-foreground/80 border-b border-border text-xs whitespace-nowrap min-w-0"
                style={getColumnCellStyle(col)}
              >
                {col.label}
              </th>
            ))}
            <th className="sticky right-0 z-[3] w-20 min-w-[80px] px-3 py-2 bg-muted border-b border-l border-border text-center font-semibold text-foreground/80 text-xs">
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
                    'sticky left-0 z-[1] w-11 px-3 py-3.5 text-center border-r border-border transition-colors',
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
                <td
                  className={cn(
                    'sticky right-0 z-[1] w-20 min-w-[80px] px-2 py-3.5 border-l border-border text-center transition-colors',
                    isRoot ? 'bg-muted/40' : 'bg-card',
                    isSelected && 'bg-primary/5',
                    'group-hover:bg-muted/80'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-md transition-all active:scale-95"
                      title={t('common.edit')}
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all active:scale-95"
                      title={t('common.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
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
