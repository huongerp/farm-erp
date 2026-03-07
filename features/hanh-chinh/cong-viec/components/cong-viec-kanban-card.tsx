import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { ClipboardList } from 'lucide-react';
import { formatDate } from '../../../../lib/utils';
import { cn } from '../../../../lib/utils';
import type { CongViec } from '../core/types';
import type { CauHinhDue } from '../core/constants';
import { getUuTienLabel, getDueStatus } from '../core/constants';

interface Props {
  item: CongViec;
  cauHinh?: CauHinhDue | null;
  onClick: () => void;
}

const CongViecKanbanCard: React.FC<Props> = ({ item, cauHinh, onClick }) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: item.id });

  const dueStatus = getDueStatus(item.ngay_het_han, cauHinh);
  const uuTienLabel = getUuTienLabel(item.uu_tien, t);
  const progress = Math.min(100, Math.max(0, item.phan_tram_hoan_thanh ?? 0));

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
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.ma_cong_viec}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
              {uuTienLabel}
            </span>
            {dueStatus === 'sap_han' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800">
                {t('congViec.dueSoon')}
              </span>
            )}
            {dueStatus === 'qua_han' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800">
                {t('congViec.overdue')}
              </span>
            )}
          </div>
          <div className="mt-2">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(item.ngay_het_han)} · {item.phan_tram_hoan_thanh}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CongViecKanbanCard;
