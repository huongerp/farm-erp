import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, GripVertical, Edit, Trash2, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useBaiHocByChuong, useDeleteBaiHoc, useReorderBaiHoc } from '../hooks/use-thiet-lap-khoa';
import { useConfirmStore } from '@/store/useConfirmStore';
import { BTN_SAVE, BTN_CANCEL, CONFIRM_DELETE } from '@/lib/button-labels';
import type { BaiHoc } from '../core/types';
import BaiHocFormDrawer from './BaiHocFormDrawer';
import BaiHocDetailDrawer from './BaiHocDetailDrawer';
import SetupContentTable from './SetupContentTable';

interface Props {
  idChuong: string;
}

const ThCell: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <th className={cn('px-3 py-2 text-left text-xs font-semibold text-foreground/80 whitespace-nowrap', className)}>
    {children}
  </th>
);

const BaiHocList: React.FC<Props> = ({ idChuong }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: list = [], isLoading } = useBaiHocByChuong(idChuong);
  const deleteMutation = useDeleteBaiHoc(idChuong);
  const reorderMutation = useReorderBaiHoc(idChuong);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BaiHoc | null>(null);
  const [detailItem, setDetailItem] = useState<BaiHoc | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLTableRowElement | null>(null);

  const sorted = React.useMemo(() => [...list].sort((a, b) => a.thu_tu - b.thu_tu), [list]);

  const displayList = React.useMemo(() => {
    if (!reorderMode || !pendingIds?.length) return sorted;
    const byId = new Map(sorted.map((b) => [b.id, b]));
    return pendingIds.map((id) => byId.get(id)).filter(Boolean) as BaiHoc[];
  }, [reorderMode, pendingIds, sorted]);

  const enterReorderMode = () => { setReorderMode(true); setPendingIds(sorted.map((b) => b.id)); };
  const saveOrder = () => {
    if (!pendingIds?.length) return;
    reorderMutation.mutate(pendingIds, { onSuccess: () => { setReorderMode(false); setPendingIds(null); } });
  };
  const cancelReorder = () => { setReorderMode(false); setPendingIds(null); };

  const handleDragEnd = () => {
    if (dragRef.current) dragRef.current.style.opacity = '1';
    if (reorderMode && pendingIds && dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const next = [...pendingIds];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(dragOverIndex, 0, removed);
      setPendingIds(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  const handleDelete = (item: BaiHoc) => {
    confirm({
      title: t('thietLapKhoa.baiHoc.delete'),
      message: t('thietLapKhoa.deleteBaiHocConfirm'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteMutation.mutate(item.id),
    });
  };

  const hasVideo = (b: BaiHoc) => !!b.video_youtube_url?.trim();
  const linkCount = (b: BaiHoc) => (b.tai_lieu_links?.length ?? 0);
  const fileCount = (b: BaiHoc) => (b.tai_lieu_files?.length ?? 0);
  const hasMoTa = (b: BaiHoc) => !!b.mo_ta?.trim();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {t('thietLapKhoa.baiHoc.title')}
        </span>
        {reorderMode ? (
          <div className="flex items-center gap-1">
            <Button type="button" variant="default" size="sm" className="min-h-[44px] sm:min-h-0 sm:h-7 gap-1 text-xs px-3" onClick={saveOrder} disabled={reorderMutation.isPending}>
              {BTN_SAVE()}
            </Button>
            <Button type="button" variant="outline" size="sm" className="min-h-[44px] sm:min-h-0 sm:h-7 gap-1 text-xs px-3" onClick={cancelReorder} disabled={reorderMutation.isPending}>
              {BTN_CANCEL()}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" className="min-h-[44px] sm:min-h-0 sm:h-7 gap-1 text-xs px-3" onClick={enterReorderMode}>
              <ListOrdered size={14} />
              {t('thietLapKhoa.reorderButton')}
            </Button>
            <Button type="button" variant="default" size="sm" className="min-h-[44px] sm:min-h-0 sm:h-7 gap-1 text-xs px-3" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={14} />
              {t('thietLapKhoa.baiHoc.add')}
            </Button>
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="py-3 flex justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden />
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4">
          <BookOpen size={16} className="opacity-50 shrink-0" aria-hidden />
          {t('thietLapKhoa.emptyBaiHoc')}
        </div>
      ) : (
        <>
        {/* Mobile: card list */}
        <div className="md:hidden space-y-2">
          {displayList.map((item, index) => (
            <div
              key={item.id}
              role={reorderMode ? undefined : 'button'}
              tabIndex={reorderMode ? undefined : 0}
              onClick={reorderMode ? undefined : () => setDetailItem(item)}
              onKeyDown={reorderMode ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailItem(item); } }}
              className={cn(
                'rounded-lg border border-border bg-card p-3 active:bg-muted/30 transition-colors',
                !reorderMode && 'cursor-pointer'
              )}
            >
              <div className="flex items-start gap-2">
                <span className={cn('shrink-0 pt-0.5', reorderMode ? 'cursor-grab touch-none text-muted-foreground' : 'text-muted-foreground/60')} aria-hidden>
                  <GripVertical size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {t('thietLapKhoa.baiHoc.displayWithNumber', { n: index + 1, ten: item.ten })}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hasVideo(item) && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Video
                      </span>
                    )}
                    {linkCount(item) > 0 && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {linkCount(item)} link
                      </span>
                    )}
                    {fileCount(item) > 0 && (
                      <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                        {fileCount(item)} file
                      </span>
                    )}
                    {hasMoTa(item) && (
                      <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {t('thietLapKhoa.table.moTa')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => { setEditing(item); setShowForm(true); }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors"
                    title={t('thietLapKhoa.baiHoc.edit')}
                    aria-label={t('thietLapKhoa.baiHoc.edit')}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 transition-colors"
                    title={t('thietLapKhoa.baiHoc.delete')}
                    aria-label={t('thietLapKhoa.baiHoc.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop: table */}
        <div className="hidden md:block">
        <SetupContentTable
          header={
            <tr className="border-b border-border bg-muted/50">
              <ThCell className="w-9 px-2" />
              <ThCell className="w-10">{t('thietLapKhoa.table.stt')}</ThCell>
              <ThCell>{t('thietLapKhoa.table.ten')}</ThCell>
              <ThCell className="w-20 text-center">{t('thietLapKhoa.table.video')}</ThCell>
              <ThCell className="w-16 text-center">{t('thietLapKhoa.table.links')}</ThCell>
              <ThCell className="w-16 text-center">{t('thietLapKhoa.table.files')}</ThCell>
              <ThCell className="w-20 text-center">{t('thietLapKhoa.table.moTa')}</ThCell>
              <ThCell className="w-24 text-center">{t('thietLapKhoa.table.actions')}</ThCell>
            </tr>
          }
        >
          {displayList.map((item, index) => (
            <tr
              key={item.id}
              ref={dragIndex === index ? dragRef : undefined}
              role={reorderMode ? undefined : 'button'}
              tabIndex={reorderMode ? undefined : 0}
              onClick={reorderMode ? undefined : () => setDetailItem(item)}
              onKeyDown={reorderMode ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailItem(item); } }}
              draggable={reorderMode && !reorderMutation.isPending}
              onDragStart={reorderMode ? (e) => {
                setDragIndex(index);
                dragRef.current = e.currentTarget as HTMLTableRowElement;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => { if (dragRef.current) dragRef.current.style.opacity = '0.4'; }, 0);
              } : undefined}
              onDragEnter={reorderMode ? () => { if (dragIndex !== null && dragIndex !== index) setDragOverIndex(index); } : undefined}
              onDragOver={(e) => reorderMode && e.preventDefault()}
              onDragEnd={reorderMode ? handleDragEnd : undefined}
              className={cn(
                'group border-b border-border/50 bg-card hover:bg-muted/20 transition-colors',
                !reorderMode && 'cursor-pointer',
                reorderMode && dragOverIndex === index && 'bg-primary/5 border-primary/30',
                reorderMode && dragIndex === index && 'opacity-40'
              )}
            >
              <td className="px-2 py-1.5 align-middle w-9" onClick={(e) => e.stopPropagation()}>
                <span className={cn('inline-flex text-muted-foreground', reorderMode ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-default opacity-60')} aria-label={t('thietLapKhoa.reorderTitle')} title={t('thietLapKhoa.reorderTitle')}>
                  <GripVertical size={14} />
                </span>
              </td>
              <td className="px-3 py-1.5 text-muted-foreground tabular-nums text-xs align-middle w-10">{index + 1}</td>
              <td className="px-3 py-1.5 align-middle min-w-0">
                <span className="text-left text-sm font-medium text-foreground truncate block">
                  {t('thietLapKhoa.baiHoc.displayWithNumber', { n: index + 1, ten: item.ten })}
                </span>
              </td>
              <td className="px-3 py-1.5 text-center align-middle w-20">
                {hasVideo(item) ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {t('thietLapKhoa.badge.co')}
                  </span>
                ) : (
                  <span className="text-muted-foreground/70 text-xs">—</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-center align-middle w-16 tabular-nums text-xs">
                {linkCount(item) > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {linkCount(item)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/70">—</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-center align-middle w-16 tabular-nums text-xs">
                {fileCount(item) > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                    {fileCount(item)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/70">—</span>
                )}
              </td>
              <td className="px-3 py-1.5 text-center align-middle w-20">
                {hasMoTa(item) ? (
                  <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t('thietLapKhoa.badge.co')}
                  </span>
                ) : (
                  <span className="text-muted-foreground/70 text-xs">—</span>
                )}
              </td>
              <td className="px-2 py-1.5 align-middle w-24" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => { setEditing(item); setShowForm(true); }}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title={t('thietLapKhoa.baiHoc.edit')}
                    aria-label={t('thietLapKhoa.baiHoc.edit')}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                    title={t('thietLapKhoa.baiHoc.delete')}
                    aria-label={t('thietLapKhoa.baiHoc.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </SetupContentTable>
        </div>
        </>
      )}
      {showForm && (
        <BaiHocFormDrawer
          idChuong={idChuong}
          initialData={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      {detailItem && (
        <BaiHocDetailDrawer
          baiHoc={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={(b) => { setDetailItem(null); setEditing(b); setShowForm(true); }}
          onDelete={(id) => { const it = displayList.find((b) => b.id === id) ?? sorted.find((b) => b.id === id); if (it) handleDelete(it); }}
        />
      )}
    </div>
  );
};

export default BaiHocList;
