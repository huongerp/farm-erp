import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { ClipboardList } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { CongViec } from '../core/types';
import { getUuTienLabel } from '../core/constants';

interface Props {
  item: CongViec;
  onClick: () => void;
}

const CongViecKanbanCard: React.FC<Props> = ({ item, onClick }) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: item.id });

  const uuTienLabel = getUuTienLabel(item.uu_tien, t);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'rounded-lg border border-border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing',
        'transition-all hover:shadow-md hover:-translate-y-0.5',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="shrink-0 mt-0.5 text-muted-foreground">
          <ClipboardList size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{item.tieu_de}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
              {uuTienLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CongViecKanbanCard;
