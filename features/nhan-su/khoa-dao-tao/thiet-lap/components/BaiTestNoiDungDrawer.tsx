import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Plus, Edit, Trash2, FileQuestion, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import DetailToolbar, { DetailToolbarAction } from '@/components/shared/DetailToolbar';
import DetailSection from '@/components/shared/DetailSection';
import Button from '@/components/ui/Button';
import { useCauHoiByBaiTest, useDeleteCauHoi, useReorderCauHoi } from '../hooks/use-thiet-lap-khoa';
import { useConfirmStore } from '@/store/useConfirmStore';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_DELETE } from '@/lib/button-labels';
import type { BaiTest } from '../core/types';
import type { CauHoi } from '../core/types';
import CauHoiFormDrawer from './CauHoiFormDrawer';

interface Props {
  baiTest: BaiTest;
  onClose: () => void;
  onEdit?: (item: BaiTest) => void;
  onDelete?: (id: string) => void;
}

const BaiTestNoiDungDrawer: React.FC<Props> = ({ baiTest, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: list = [], isLoading } = useCauHoiByBaiTest(baiTest.id);
  const deleteMutation = useDeleteCauHoi(baiTest.id);
  const reorderMutation = useReorderCauHoi(baiTest.id);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CauHoi | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const sorted = React.useMemo(() => [...list].sort((a, b) => a.thu_tu - b.thu_tu), [list]);

  const handleDragEnd = useCallback(() => {
    if (dragRef.current) dragRef.current.style.opacity = '1';
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const reordered = [...sorted];
      const [removed] = reordered.splice(dragIndex, 1);
      reordered.splice(dragOverIndex, 0, removed);
      reorderMutation.mutate(reordered.map((c) => c.id));
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  }, [dragIndex, dragOverIndex, sorted, reorderMutation]);

  const handleDelete = useCallback(
    (item: CauHoi) => {
      confirm({
        title: t('thietLapKhoa.deleteCauHoiTitle'),
        message: t('thietLapKhoa.deleteCauHoiConfirm'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => deleteMutation.mutate(item.id),
      });
    },
    [confirm, t, deleteMutation]
  );

  const toolbarActions: DetailToolbarAction[] = [
    ...(onEdit
      ? [{
          label: BTN_EDIT(),
          icon: <Edit size={16} />,
          variant: 'primary' as const,
          onClick: () => { onClose(); onEdit(baiTest); },
        }]
      : []),
    ...(onDelete
      ? [{
          label: BTN_DELETE(),
          icon: <Trash2 size={16} />,
          variant: 'danger' as const,
          onClick: () => { onClose(); onDelete(baiTest.id); },
        }]
      : []),
    {
      label: t('thietLapKhoa.cauHoi.add'),
      icon: <Plus size={16} />,
      variant: 'primary' as const,
      onClick: () => { setEditing(null); setShowForm(true); },
    },
  ];

  const footer = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-2 flex-wrap">
          {onEdit && (
            <Button onClick={() => { onClose(); onEdit(baiTest); }} className="bg-primary text-white shadow-lg hover:bg-primary/90">
              <Edit size={16} className="mr-2" /> {BTN_EDIT()}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              onClick={() => { onClose(); onDelete(baiTest.id); }}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
            >
              <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericDrawer
      title={baiTest.ten}
      subtitle={t('thietLapKhoa.baiTest.noiDung')}
      icon={<FileQuestion size={20} className="text-primary" />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileQuestion size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{baiTest.ten}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {t('thietLapKhoa.baiTest.noiDung')}
            </p>
            {baiTest.mo_ta && (
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{baiTest.mo_ta}</p>
            )}
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('thietLapKhoa.cauHoi.title')} icon={<HelpCircle size={14} />} variant="primary">
          {isLoading ? (
            <div className="py-6 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <HelpCircle size={18} className="opacity-50 shrink-0" aria-hidden />
              {t('thietLapKhoa.emptyCauHoi')}
            </div>
          ) : (
            <ul className="space-y-2">
              {sorted.map((item, index) => (
                <li key={item.id}>
                  <div
                    ref={dragIndex === index ? dragRef : undefined}
                    draggable={!reorderMutation.isPending}
                    aria-busy={reorderMutation.isPending}
                    onDragStart={(e) => {
                      setDragIndex(index);
                      dragRef.current = e.currentTarget as HTMLDivElement;
                      e.dataTransfer.effectAllowed = 'move';
                      setTimeout(() => { if (dragRef.current) dragRef.current.style.opacity = '0.4'; }, 0);
                    }}
                    onDragEnter={() => { if (dragIndex !== null && dragIndex !== index) setDragOverIndex(index); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/20',
                      dragOverIndex === index && 'border-primary/30 bg-primary/5',
                      dragIndex === index && 'opacity-40'
                    )}
                  >
                    <span className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground mt-0.5" aria-label={t('thietLapKhoa.reorderTitle')} title={t('thietLapKhoa.reorderTitle')}><GripVertical size={14} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.noi_dung}</p>
                      <span className="text-xs text-muted-foreground">{item.loai === 'trac_nghiem' ? t('thietLapKhoa.cauHoi.tracNghiem') : t('thietLapKhoa.cauHoi.tuLuan')}</span>
                      {item.dap_an_options?.length ? (
                        <ul className="mt-1 text-xs text-muted-foreground">
                          {item.dap_an_options.map((opt, i) => (
                            <li key={i}>{opt.dung ? '✓ ' : ''}{opt.label}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <button type="button" onClick={() => { setEditing(item); setShowForm(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title={t('common.edit')} aria-label={t('common.edit')}><Edit size={14} /></button>
                    <button type="button" onClick={() => handleDelete(item)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all" title={t('common.delete')} aria-label={t('common.delete')}><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DetailSection>
      </div>
      {showForm && (
        <CauHoiFormDrawer
          idBaiTest={baiTest.id}
          initialData={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </GenericDrawer>
  );
};

export default BaiTestNoiDungDrawer;
