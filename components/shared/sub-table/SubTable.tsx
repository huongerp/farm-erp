import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../../lib/utils';
import { useIsMobile } from '../../../lib/hooks/use-is-mobile';
import type { ColumnConfig } from '../../../store/createGenericStore';
import ColumnResizeHandle from '../column-header/ColumnResizeHandle';
import { useSubTableWidths } from './use-sub-table-widths';

/**
 * Bảng con chuẩn trong drawer Form/Detail — cùng khuôn với `GenericTable` nhưng
 * gọn: không chọn dòng, không phân trang, không ẩn/hiện cột.
 *
 * Desktop (≥ md): `table-layout: fixed` + `<colgroup>` + một `<col>` đệm (thiếu
 * ba thứ này thì kéo đổi bề rộng cột "không ăn"), ghim trái cột `#` + các cột
 * `sticky`, ghim phải cột Thao tác, kéo đổi bề rộng lưu theo `tableKey`.
 *
 * Mobile (< md): danh sách card thay cho bảng nhiều cột cuộn ngang — chỉ render
 * MỘT trong hai (không ẩn bằng CSS) để form react-hook-form không đăng ký hai ô
 * input cùng tên.
 */

export interface SubTableColumn {
  id: string;
  label: string;
  /** Bề rộng mặc định (px) khi người dùng chưa kéo. */
  width: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'right' | 'center';
  /** Ghim trái khi cuộn ngang — các cột ghim phải liền nhau ngay sau cột `#`. */
  sticky?: boolean;
  /** Mặc định `true`. */
  resizable?: boolean;
  /**
   * Vị trí trên card mobile: `title` dòng tiêu đề, `badge` góc phải tiêu đề,
   * `field` ô trong lưới 2 cột (mặc định), `full` ô chiếm cả hàng, `hidden` bỏ.
   */
  mobile?: 'title' | 'badge' | 'field' | 'full' | 'hidden';
  /** Class thêm cho `<td>`. */
  className?: string;
}

type SubTableLayout = 'table' | 'card';
interface SubTableLayoutContextValue {
  layout: SubTableLayout;
}
const SubTableLayoutContext = createContext<SubTableLayoutContextValue>({ layout: 'table' });

/** Nút thao tác biết mình đang nằm trong bảng (icon) hay card mobile (nút có chữ). */
export function useSubTableLayout(): SubTableLayout {
  return useContext(SubTableLayoutContext).layout;
}

interface SubTableProps<T> {
  /** Khoá lưu bề rộng cột, dạng `<module>.<bảng>`. */
  tableKey: string;
  columns: SubTableColumn[];
  rows: T[];
  keyExtractor: (row: T, index: number) => string;
  renderCell: (colId: string, row: T, index: number) => React.ReactNode;
  /**
   * Có thì hiện cột Thao tác ghim phải (desktop) / hàng nút cuối card (mobile).
   * Trả `null` cho dòng không có thao tác nào để card mobile không vẽ vạch ngăn thừa.
   */
  renderActions?: (row: T, index: number) => React.ReactNode;
  actionsWidth?: number;
  /** Thay card mobile mặc định (vd. form nhập liệu cần xếp ô theo ý riêng). */
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
  /** Chạm vào card mobile — hành động chính của dòng. */
  onMobileCardClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string | undefined;
  /** Hiện khi `rows` rỗng. */
  emptyContent?: React.ReactNode;
  /** Chiều cao tối đa vùng cuộn trên desktop (mobile cuộn theo drawer). */
  maxHeight?: string;
  /** Cột số thứ tự `#` (mặc định có). */
  showIndex?: boolean;
  className?: string;
}

const INDEX_WIDTH = 44;
const DEFAULT_MIN = 60;
const DEFAULT_MAX = 640;
/**
 * Tiền tố id khi đưa sang `ColumnResizeHandle`: `clampColumnWidth` đoán preset
 * theo id (`ghi_chu` → min 220px…) — bảng con tự khai min/max nên tránh bị đoán.
 */
const RESIZE_ID_PREFIX = 'sub:';

function clampWidth(col: SubTableColumn, width: number): number {
  return Math.min(Math.max(width, col.minWidth ?? DEFAULT_MIN), col.maxWidth ?? DEFAULT_MAX);
}

const alignClass = (align: SubTableColumn['align']) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

function SubTable<T>({
  tableKey,
  columns,
  rows,
  keyExtractor,
  renderCell,
  renderActions,
  actionsWidth = 112,
  renderMobileCard,
  onMobileCardClick,
  rowClassName,
  emptyContent,
  maxHeight = '420px',
  showIndex = true,
  className,
}: SubTableProps<T>) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { widths: saved, setWidth } = useSubTableWidths(tableKey);

  const widths = useMemo(
    () => columns.map((c) => clampWidth(c, saved[c.id] ?? c.width)),
    [columns, saved]
  );

  const stickyLeft = useMemo(() => {
    const out: (number | null)[] = [];
    let left = showIndex ? INDEX_WIDTH : 0;
    let stillSticky = true;
    columns.forEach((c, i) => {
      stillSticky = stillSticky && !!c.sticky;
      out.push(stillSticky ? left : null);
      if (stillSticky) left += widths[i];
    });
    return out;
  }, [columns, widths, showIndex]);

  const lastStickyIndex = stickyLeft.reduce<number>((acc, v, i) => (v != null ? i : acc), -1);

  const resizeConfigs = useMemo<ColumnConfig[]>(
    () =>
      columns.map((c, i) => ({
        id: RESIZE_ID_PREFIX + c.id,
        label: c.label,
        visible: true,
        order: i,
        width: widths[i],
        minWidth: c.minWidth ?? DEFAULT_MIN,
        maxWidth: c.maxWidth ?? DEFAULT_MAX,
      })),
    [columns, widths]
  );

  const onResize = (id: string, width: number) => setWidth(id.slice(RESIZE_ID_PREFIX.length), width);

  const tableMinWidth =
    (showIndex ? INDEX_WIDTH : 0) + widths.reduce((a, b) => a + b, 0) + (renderActions ? actionsWidth : 0);

  if (rows.length === 0 && emptyContent) {
    return <div className={cn('rounded-xl border border-dashed border-border bg-card', className)}>{emptyContent}</div>;
  }

  if (isMobile) {
    return (
      <SubTableLayoutContext.Provider value={{ layout: 'card' }}>
        <ul className={cn('space-y-2.5', className)}>
          {rows.map((row, index) => (
            <li key={keyExtractor(row, index)}>
              {renderMobileCard ? (
                renderMobileCard(row, index)
              ) : (
                <DefaultMobileCard
                  columns={columns}
                  row={row}
                  index={index}
                  showIndex={showIndex}
                  renderCell={renderCell}
                  actions={renderActions?.(row, index)}
                  onClick={onMobileCardClick}
                  className={rowClassName?.(row, index)}
                />
              )}
            </li>
          ))}
        </ul>
      </SubTableLayoutContext.Provider>
    );
  }

  return (
    <SubTableLayoutContext.Provider value={{ layout: 'table' }}>
      <div className={cn('rounded-xl border border-border overflow-hidden bg-card', className)}>
        <div className="overflow-auto custom-scrollbar" style={{ maxHeight, overscrollBehavior: 'contain' }}>
          <table
            className="text-body-sm text-left border-separate border-spacing-0"
            style={{ minWidth: tableMinWidth, width: '100%', tableLayout: 'fixed' }}
          >
            <colgroup>
              {showIndex && <col style={{ width: INDEX_WIDTH }} />}
              {columns.map((c, i) => (
                <col key={c.id} style={{ width: widths[i] }} />
              ))}
              <col />
              {renderActions && <col style={{ width: actionsWidth }} />}
            </colgroup>
            <thead className="sticky top-0 z-[2]">
              <tr>
                {showIndex && (
                  <th
                    className="sticky left-0 z-[3] px-2 py-2 bg-muted border-b border-border text-center text-xs font-semibold text-foreground/80"
                    style={{ width: INDEX_WIDTH }}
                  >
                    #
                  </th>
                )}
                {columns.map((c, i) => {
                  const left = stickyLeft[i];
                  return (
                    <th
                      key={c.id}
                      className={cn(
                        'relative px-3 py-2 bg-muted border-b border-border text-xs font-semibold text-foreground/80 whitespace-nowrap',
                        alignClass(c.align),
                        left != null && 'sticky z-[3]',
                        i === lastStickyIndex && 'border-r'
                      )}
                      style={left != null ? { left } : undefined}
                    >
                      <div className="min-w-0 overflow-hidden text-ellipsis">{c.label}</div>
                      {c.resizable !== false && (
                        <ColumnResizeHandle col={resizeConfigs[i]} onResizeColumn={onResize} />
                      )}
                    </th>
                  );
                })}
                <th className="bg-muted border-b border-border" aria-hidden />
                {renderActions && (
                  <th
                    className="sticky right-0 z-[3] px-2 py-2 bg-muted border-b border-l border-border text-center text-xs font-semibold text-foreground/80 whitespace-nowrap"
                    style={{ width: actionsWidth }}
                  >
                    {t('common.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  className={cn('group transition-colors hover:bg-accent', rowClassName?.(row, index))}
                >
                  {showIndex && (
                    <td className="sticky left-0 z-[1] px-2 py-2 text-center text-muted-foreground tabular-nums bg-card group-hover:bg-accent border-b border-border">
                      {index + 1}
                    </td>
                  )}
                  {columns.map((c, i) => {
                    const left = stickyLeft[i];
                    return (
                      <td
                        key={c.id}
                        className={cn(
                          'px-3 py-2 align-middle border-b border-border',
                          alignClass(c.align),
                          left != null && 'sticky z-[1] bg-card group-hover:bg-accent',
                          i === lastStickyIndex && 'border-r shadow-[6px_0_8px_-6px_rgba(0,0,0,0.12)]',
                          c.className
                        )}
                        style={left != null ? { left } : undefined}
                      >
                        <div className="min-w-0 break-words">{renderCell(c.id, row, index)}</div>
                      </td>
                    );
                  })}
                  <td className="border-b border-border" aria-hidden />
                  {renderActions && (
                    <td className="sticky right-0 z-[1] px-1.5 py-1.5 bg-card group-hover:bg-accent border-b border-l border-border shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)]">
                      <div className="flex items-center justify-center gap-0.5">{renderActions(row, index)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SubTableLayoutContext.Provider>
  );
}

interface DefaultMobileCardProps<T> {
  columns: SubTableColumn[];
  row: T;
  index: number;
  showIndex: boolean;
  renderCell: (colId: string, row: T, index: number) => React.ReactNode;
  actions?: React.ReactNode;
  onClick?: (row: T) => void;
  className?: string;
}

function DefaultMobileCard<T>({
  columns,
  row,
  index,
  showIndex,
  renderCell,
  actions,
  onClick,
  className,
}: DefaultMobileCardProps<T>) {
  const titleCols = columns.filter((c) => c.mobile === 'title');
  const badgeCols = columns.filter((c) => c.mobile === 'badge');
  const bodyCols = columns.filter((c) => !c.mobile || c.mobile === 'field' || c.mobile === 'full');
  const hasActions = actions != null && actions !== false;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-3 space-y-2.5 shadow-sm',
        onClick && 'cursor-pointer active:bg-accent transition-colors',
        className
      )}
      {...(onClick
        ? {
            role: 'button',
            tabIndex: 0,
            onClick: () => onClick(row),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(row);
              }
            },
          }
        : {})}
    >
      <div className="flex items-start gap-2">
        {showIndex && (
          <span className="shrink-0 mt-0.5 inline-flex h-6 min-w-6 px-1.5 items-center justify-center rounded-md bg-muted text-caption font-medium text-muted-foreground tabular-nums">
            {index + 1}
          </span>
        )}
        <div className="flex-1 min-w-0 space-y-0.5">
          {titleCols.map((c) => (
            <div key={c.id} className="min-w-0 break-words">
              {renderCell(c.id, row, index)}
            </div>
          ))}
        </div>
        {badgeCols.length > 0 && (
          <div className="shrink-0 flex flex-col items-end gap-1">
            {badgeCols.map((c) => (
              <div key={c.id}>{renderCell(c.id, row, index)}</div>
            ))}
          </div>
        )}
      </div>

      {bodyCols.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {bodyCols.map((c) => (
            <div key={c.id} className={cn('min-w-0', c.mobile === 'full' && 'col-span-2')}>
              <dt className="text-caption text-muted-foreground">{c.label}</dt>
              <dd className="text-body-sm text-foreground break-words">{renderCell(c.id, row, index)}</dd>
            </div>
          ))}
        </dl>
      )}

      {hasActions && (
        // Chặn nổi bọt: bấm nút không kích hoạt hành động chạm-cả-card.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="flex flex-wrap gap-2 pt-2.5 border-t border-dashed border-border" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

export default SubTable;
