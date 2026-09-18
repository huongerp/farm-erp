import React from 'react';

import { useColumnResize } from '../../../lib/table-core/use-column-resize';
import type { ColumnConfig } from '../../../store/createGenericStore';
import { cn } from '../../../lib/utils';

interface Props {
  col: ColumnConfig;
  onResizeColumn?: (id: string, width: number) => void;
}

/**
 * Vạch kéo ở mép phải header cột.
 *
 * `<th>` chứa nó phải có `relative`. `data-autofit-ignore` để phép đo auto-fit bỏ
 * qua chính vạch này (nó absolute, tính vào thì cột không co lại được).
 */
const ColumnResizeHandle: React.FC<Props> = ({ col, onResizeColumn }) => {
  const { isResizing, dragWidth, start, onKeyDown, autoFit } = useColumnResize(col, onResizeColumn);
  if (!onResizeColumn) return null;

  return (
    // `separator` có thể focus được là đúng chuẩn ARIA cho vạch kéo đổi kích thước
    // (window splitter): người dùng bàn phím chỉnh bề rộng bằng ←/→.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Đổi bề rộng cột ${col.label}`}
      data-autofit-ignore
      onPointerDown={start}
      onDoubleClick={autoFit}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-10 touch-none group/handle',
        'hover:bg-primary/30 active:bg-primary/50 transition-colors',
        'focus-visible:outline-none focus-visible:bg-primary/50',
        isResizing && 'bg-primary/50'
      )}
    >
      <div className="absolute right-[2px] top-1/2 -translate-y-1/2 w-[1px] h-3.5 bg-border group-hover/handle:bg-primary/60 transition-colors" />
      {isResizing && dragWidth != null && (
        <div className="absolute -top-6 right-0 px-1.5 py-0.5 rounded bg-foreground text-background text-[10px] tabular-nums shadow-sm pointer-events-none">
          {Math.round(dragWidth)}px
        </div>
      )}
    </div>
  );
};

export default ColumnResizeHandle;
