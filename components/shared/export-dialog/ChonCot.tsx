import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, GripVertical, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ExportColumn } from '../../../lib/export/dinh-dang-o';

interface ChonCotProps {
  ordered: ExportColumn[];
  selectedSet: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: () => void;
  onMove: (from: number, to: number) => void;
  onReset: () => void;
}

/** Danh sách cột xuất: tick chọn + kéo đổi thứ tự (cùng kiểu kéo với ColumnManager). */
const ChonCot: React.FC<ChonCotProps> = ({ ordered, selectedSet, onToggle, onToggleAll, onMove, onReset }) => {
  const { t } = useTranslation();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const endDrag = () => {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) onMove(dragIndex, overIndex);
    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  };

  const allSelected = selectedSet.size === ordered.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t('shared.export.selectColumns')}{' '}
          <span className="tabular-nums opacity-60">
            ({selectedSet.size}/{ordered.length})
          </span>
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onReset} className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground">
            <RotateCcw size={10} />
            {t('common.reset')}
          </button>
          <button type="button" onClick={onToggleAll} className="text-2xs text-primary hover:underline">
            {allSelected ? t('shared.export.deselectAll') : t('shared.export.selectAll')}
          </button>
        </div>
      </div>
      <p className="text-2xs text-muted-foreground/70 mb-1.5">{t('shared.export.dragHint')}</p>
      <div className="grid grid-cols-2 gap-1">
        {ordered.map((col, index) => {
          const on = selectedSet.has(col.key);
          return (
            <div
              key={col.key}
              draggable
              onDragStart={(e) => {
                setDragIndex(index);
                dragNode.current = e.currentTarget;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => {
                  if (dragNode.current) dragNode.current.style.opacity = '0.4';
                }, 0);
              }}
              onDragEnter={() => dragIndex !== null && dragIndex !== index && setOverIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={endDrag}
              role="checkbox"
              aria-checked={on}
              tabIndex={0}
              onClick={() => onToggle(col.key)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onToggle(col.key);
                }
              }}
              className={cn(
                'group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer select-none transition-all text-xs',
                on ? 'bg-primary/5 text-foreground' : 'text-muted-foreground hover:bg-muted/50',
                overIndex === index && 'bg-primary/10 border border-primary/20 border-dashed',
              )}
            >
              <GripVertical size={12} className="shrink-0 cursor-grab text-muted-foreground/40 group-hover:text-muted-foreground" />
              <div
                className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0',
                  on ? 'bg-primary border-primary text-white' : 'border-border',
                )}
              >
                {on && <Check size={8} className="stroke-[3px]" />}
              </div>
              <span className="truncate">{col.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChonCot;
