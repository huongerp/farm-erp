import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../../../lib/utils';

interface Props {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

const CongViecKanbanColumn: React.FC<Props> = ({ id, title, count, children }) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'shrink-0 w-[280px] flex flex-col rounded-xl border border-border bg-card shadow-sm transition-colors overflow-hidden',
        isOver && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      <div className="shrink-0 py-2.5 px-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm text-foreground truncate">{title}</span>
          <span className="shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-2 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary">
            {count}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-[200px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {count === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 px-2">
            {t('congViec.kanban.columnEmpty')}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default CongViecKanbanColumn;
