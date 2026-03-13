import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { CongViec } from '../core/types';
import { getTrangThaiLabel } from '../core/constants';
import { useUpdateCongViec } from '../hooks/use-cong-viec';
import { CONG_VIEC_TRANG_THAI } from '../core/constants';
import type { CongViecTrangThai } from '../core/types';
import KanbanColumn from './cong-viec-kanban-column';
import KanbanCard from './cong-viec-kanban-card';
import EmptyState from '../../../../components/shared/EmptyState';

interface Props {
  data: CongViec[];
  onView: (item: CongViec) => void;
}

const CongViecKanban: React.FC<Props> = ({ data, onView }) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateCongViec();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const taskId = String(active.id);
    const newStatus = String(over.id) as CongViecTrangThai;
    if (!CONG_VIEC_TRANG_THAI.includes(newStatus)) return;
    const task = data.find((c) => String(c.id) === taskId || c.id === Number(taskId));
    if (!task || task.trang_thai === newStatus) return;
    updateMutation.mutate({ id: task.id, data: { trang_thai: newStatus } });
  };

  const columns = CONG_VIEC_TRANG_THAI.map((status) => ({
    id: status,
    label: getTrangThaiLabel(status, t),
    items: data.filter((c) => c.trang_thai === status),
  }));

  if (data.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        <EmptyState title={t('congViec.empty')} description={t('congViec.emptyHint')} />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex-1 min-h-0 flex gap-5 overflow-x-auto px-4 pb-4 custom-scrollbar">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.label}
            count={col.items.length}
          >
            {col.items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                onClick={() => onView(item)}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>
    </DndContext>
  );
};

export default CongViecKanban;
