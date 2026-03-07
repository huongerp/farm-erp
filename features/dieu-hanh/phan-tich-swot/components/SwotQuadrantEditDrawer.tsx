import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Settings, Plus, Trash2, GripVertical } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import type { SwotItem } from '../core/types';
import type { Quadrant } from '../constants/suggested-criteria';
import { SUGGESTED_CRITERIA } from '../constants/suggested-criteria';
import { cn } from '../../../../lib/utils';

const genId = () => `swot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface Props {
  quadrant: Quadrant;
  quadrantLabel: string;
  items: SwotItem[];
  onSave: (items: SwotItem[]) => Promise<void>;
  onClose: () => void;
}

const SwotQuadrantEditDrawer: React.FC<Props> = ({
  quadrant,
  quadrantLabel,
  items,
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  const [list, setList] = useState<SwotItem[]>(() => [...items]);
  const [newItemText, setNewItemText] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const addItem = (text: string) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    if (list.some((x) => x.text === trimmed)) return;
    setList((prev) => [...prev, { id: genId(), text: trimmed }]);
    setNewItemText('');
  };

  const addFromSuggestion = (text: string) => {
    addItem(text);
  };

  const updateItem = (id: string, text: string) => {
    const trimmed = text.trim();
    setList((prev) => prev.map((x) => (x.id === id ? { ...x, text: trimmed } : x)));
  };

  const removeItem = (id: string) => {
    setList((prev) => prev.filter((x) => x.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (e.currentTarget instanceof HTMLElement) {
      dragRef.current = e.currentTarget;
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragRef.current) dragRef.current.style.opacity = '1';
    dragRef.current = null;
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setList((prev) => {
        const next = [...prev];
        const [removed] = next.splice(dragIndex, 1);
        next.splice(dragOverIndex, 0, removed);
        return next;
      });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    const filtered = list.filter((x) => x.text.trim()).map((x) => ({ ...x, text: x.text.trim() }));
    setSaving(true);
    try {
      await onSave(filtered);
      toast.success(t('phanTichSwot.saveSuccess'));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const suggestions = SUGGESTED_CRITERIA[quadrant];

  return (
    <GenericDrawer
      title={t('phanTichSwot.editQuadrantTitle', { quadrant: quadrantLabel })}
      icon={<Settings size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="swot-quadrant-form"
          onCancel={onClose}
          isLoading={saving}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="swot-quadrant-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
        <FormSection title={quadrantLabel} variant="primary">
          <p className="text-xs text-muted-foreground mb-2">{t('phanTichSwot.reorderHint')}</p>
          <div className="space-y-2">
            {list.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                className={cn(
                  'flex gap-2 items-center rounded-lg border border-border bg-muted/20 p-2 transition-all',
                  dragOverIndex === index && 'ring-2 ring-primary/30 border-primary/40 bg-primary/5',
                  dragIndex === index && 'opacity-50'
                )}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span
                  className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground p-1 -m-1 rounded"
                  title={t('phanTichSwot.reorderTitle')}
                  aria-label={t('phanTichSwot.reorderTitle')}
                >
                  <GripVertical size={16} />
                </span>
                <Input
                  value={item.text}
                  onChange={(e) => updateItem(item.id, e.target.value)}
                  placeholder={t('phanTichSwot.itemPlaceholder')}
                  className="flex-1 min-w-0"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive shrink-0"
                  onClick={() => removeItem(item.id)}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder={t('phanTichSwot.itemPlaceholder')}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem(newItemText);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem(newItemText)}
              >
                <Plus size={14} className="mr-1" />
                {t('common.add')}
              </Button>
            </div>
          </div>
        </FormSection>

        <FormSection title={t('phanTichSwot.suggestionsTitle')} variant="primary">
          <p className="text-xs text-muted-foreground mb-3">{t('phanTichSwot.addSuggestion')}</p>
          <div className="space-y-4">
            {suggestions.map((group) => (
              <div key={group.groupKey}>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                  {t(group.groupKey)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.itemKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => addFromSuggestion(t(key))}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 text-sm text-foreground',
                        'hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors'
                      )}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default SwotQuadrantEditDrawer;
