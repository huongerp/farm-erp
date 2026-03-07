import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, GripVertical, Edit, Plus, Trash2, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import Button from '@/components/ui/Button';
import { useKhoaDaoTaos } from '../hooks/use-khoa-dao-tao';
import {
  useChuongByKhoaHoc,
  useDeleteChuong,
  useReorderChuong,
} from './hooks/use-thiet-lap-khoa';
import { useConfirmStore } from '@/store/useConfirmStore';
import { BTN_SAVE, BTN_CANCEL, CONFIRM_DELETE } from '@/lib/button-labels';
import type { ChuongKhoaHoc } from './core/types';
import ChuongFormDrawer from './components/ChuongFormDrawer';
import ChuongAccordion from './components/ChuongAccordion';

const ThietLapKhoaHocPage: React.FC = () => {
  const { idKhoa } = useParams<{ idKhoa: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: khoaList = [], isLoading: khoaLoading } = useKhoaDaoTaos();
  const khoa = idKhoa ? khoaList.find((k) => k.id === idKhoa) : null;

  const { data: chuongList = [], isLoading: chuongLoading } = useChuongByKhoaHoc(idKhoa ?? undefined);
  const deleteChuongMutation = useDeleteChuong(idKhoa ?? '', undefined);
  const reorderChuongMutation = useReorderChuong(idKhoa ?? '', undefined);

  const [showChuongForm, setShowChuongForm] = useState(false);
  const [editingChuong, setEditingChuong] = useState<ChuongKhoaHoc | null>(null);
  const [reorderChuongMode, setReorderChuongMode] = useState(false);
  const [pendingChuongIds, setPendingChuongIds] = useState<string[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const sortedChuong = React.useMemo(
    () => [...chuongList].sort((a, b) => a.thu_tu - b.thu_tu),
    [chuongList]
  );

  const displayChuong = React.useMemo(() => {
    if (!reorderChuongMode || !pendingChuongIds?.length) return sortedChuong;
    const byId = new Map(sortedChuong.map((c) => [c.id, c]));
    return pendingChuongIds.map((id) => byId.get(id)).filter(Boolean) as ChuongKhoaHoc[];
  }, [reorderChuongMode, pendingChuongIds, sortedChuong]);

  const enterReorderMode = useCallback(() => {
    setReorderChuongMode(true);
    setPendingChuongIds(sortedChuong.map((c) => c.id));
  }, [sortedChuong]);

  const saveChuongOrder = useCallback(() => {
    if (!pendingChuongIds?.length || !idKhoa) return;
    reorderChuongMutation.mutate(pendingChuongIds, {
      onSuccess: () => { setReorderChuongMode(false); setPendingChuongIds(null); },
    });
  }, [idKhoa, pendingChuongIds, reorderChuongMutation]);

  const cancelChuongReorder = useCallback(() => {
    setReorderChuongMode(false);
    setPendingChuongIds(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragNodeRef.current) dragNodeRef.current.style.opacity = '0.4';
    }, 0);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = '1';
    if (reorderChuongMode && pendingChuongIds && dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const next = [...pendingChuongIds];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(dragOverIndex, 0, removed);
      setPendingChuongIds(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  }, [reorderChuongMode, pendingChuongIds, dragIndex, dragOverIndex]);

  const handleDeleteChuong = useCallback(
    (chuong: ChuongKhoaHoc) => {
      confirm({
        title: t('thietLapKhoa.chuong.delete'),
        message: t('thietLapKhoa.deleteChuongConfirm'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => deleteChuongMutation.mutate(chuong.id),
      });
    },
    [confirm, t, deleteChuongMutation]
  );

  const isLoading = khoaLoading || chuongLoading;

  const handleBack = useCallback(() => {
    navigate('/nhan-su/khoa-dao-tao', { state: { openDetailId: idKhoa } });
  }, [navigate, idKhoa]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-2.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:flex-1 sm:min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 shrink-0 min-h-[44px] min-w-[44px] sm:min-w-0 sm:h-9 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3"
              onClick={handleBack}
              aria-label={t('thietLapKhoa.back')}
            >
              <ArrowLeft size={18} className="stroke-[2.5px] shrink-0" />
              <span className="hidden sm:inline">{t('thietLapKhoa.back')}</span>
            </Button>
            <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate min-w-0 flex-1 line-clamp-2 sm:line-clamp-1">
              {khoa ? `${t('thietLapKhoa.title')}: ${khoa.ten}` : t('thietLapKhoa.title')}
            </h1>
          </div>
          {idKhoa && khoa && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:ml-auto">
              {reorderChuongMode ? (
                <>
                  <Button type="button" variant="default" size="sm" className="gap-2 min-h-[44px] sm:min-h-0 sm:h-9 px-4" onClick={saveChuongOrder} disabled={reorderChuongMutation.isPending}>
                    {BTN_SAVE()}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-2 min-h-[44px] sm:min-h-0 sm:h-9 px-4" onClick={cancelChuongReorder} disabled={reorderChuongMutation.isPending}>
                    {BTN_CANCEL()}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" size="sm" className="gap-2 min-h-[44px] sm:min-h-0 sm:h-9 px-3 sm:px-2.5" onClick={enterReorderMode} aria-label={t('thietLapKhoa.reorderButton')}>
                    <ListOrdered size={18} className="shrink-0" />
                    <span className="hidden sm:inline">{t('thietLapKhoa.reorderButton')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="gap-2 min-h-[44px] sm:min-h-0 sm:h-9 px-3 sm:px-2.5"
                    onClick={() => { setEditingChuong(null); setShowChuongForm(true); }}
                    aria-label={t('thietLapKhoa.addChuong')}
                  >
                    <Plus size={18} className="shrink-0" />
                    <span className="hidden sm:inline">{t('thietLapKhoa.addChuong')}</span>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : !idKhoa || !khoa ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
              {!idKhoa ? t('shared.mobileFilter.notFound') : t('khoaDaoTao.service.notFound')}
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              <div className="space-y-2">
                {displayChuong.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground text-sm">
                    <BookOpen size={32} className="opacity-50" aria-hidden />
                    {t('thietLapKhoa.emptyChuong')}
                  </div>
                ) : (
                  displayChuong.map((chuong, index) => (
                    <div
                      key={chuong.id}
                      draggable={reorderChuongMode && !reorderChuongMutation.isPending}
                      aria-busy={reorderChuongMutation.isPending}
                      onDragStart={reorderChuongMode ? (e) => handleDragStart(e, index) : undefined}
                      onDragEnter={reorderChuongMode ? () => handleDragEnter(index) : undefined}
                      onDragOver={(e) => reorderChuongMode && e.preventDefault()}
                      onDragEnd={reorderChuongMode ? handleDragEnd : undefined}
                      className={cn(
                        'rounded-xl border border-border bg-card overflow-hidden transition-all',
                        reorderChuongMode && dragOverIndex === index && 'ring-2 ring-primary/30 border-primary/40',
                        reorderChuongMode && dragIndex === index && 'opacity-40'
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5 sm:py-2 border-b border-border bg-muted/30">
                        <span
                          className={cn(
                            'p-1.5 sm:p-1 rounded text-muted-foreground shrink-0',
                            reorderChuongMode ? 'cursor-grab active:cursor-grabbing touch-none hover:text-foreground' : 'cursor-default opacity-60'
                          )}
                          title={t('thietLapKhoa.reorderTitle')}
                          aria-label={t('thietLapKhoa.reorderTitle')}
                        >
                          <GripVertical size={18} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-primary block line-clamp-2 sm:line-clamp-1 text-sm sm:text-base">
                            {t('thietLapKhoa.chuong.displayWithNumber', { n: index + 1, ten: chuong.ten })}
                          </span>
                          {chuong.mo_ta && (
                            <span className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{chuong.mo_ta}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingChuong(chuong);
                              setShowChuongForm(true);
                            }}
                            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 active:bg-primary/20 transition-all"
                            title={t('thietLapKhoa.chuong.edit')}
                            aria-label={t('thietLapKhoa.chuong.edit')}
                          >
                            <Edit size={18} className="sm:w-4 sm:h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChuong(chuong)}
                            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 transition-all"
                            title={t('thietLapKhoa.chuong.delete')}
                            aria-label={t('thietLapKhoa.chuong.delete')}
                          >
                            <Trash2 size={18} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                      <ChuongAccordion idKhoaHoc={idKhoa} chuong={chuong} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showChuongForm && idKhoa && (
          <ChuongFormDrawer
            idKhoaHoc={idKhoa}
            initialData={editingChuong}
            onClose={() => {
              setShowChuongForm(false);
              setEditingChuong(null);
            }}
          />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
};

export default ThietLapKhoaHocPage;
