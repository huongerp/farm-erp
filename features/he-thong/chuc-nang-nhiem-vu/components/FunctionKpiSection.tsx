import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Layers, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { DeptFunction, Task } from '../core/types';
import type { KpiIndicator } from '../core/types';
import TaskKpiBlock from './TaskKpiBlock';
import { cn } from '../../../../lib/utils';

interface Props {
  fn: DeptFunction;
  tasks: Task[];
  defaultExpanded?: boolean;
  onAddTask?: (fn: DeptFunction) => void;
  onAddKpi: (task: Task) => void;
  onViewKpi: (k: KpiIndicator) => void;
  onEditKpi: (k: KpiIndicator) => void;
  onDeleteKpi: (id: string) => void;
}

const FunctionKpiSection: React.FC<Props> = ({
  fn,
  tasks,
  defaultExpanded = true,
  onAddTask,
  onAddKpi,
  onViewKpi,
  onEditKpi,
  onDeleteKpi,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Cấp 1: Chức năng (collapsible) + nút Thêm nhiệm vụ */}
      <div className="flex items-center gap-2 w-full px-4 py-3 bg-muted/40 border-b border-border">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            'flex items-center gap-3 flex-1 min-w-0 text-left transition-colors rounded-lg hover:bg-muted/60 -m-1 p-1'
          )}
          aria-expanded={expanded}
        >
          <span className="text-muted-foreground shrink-0">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Layers size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{fn.ten_chuc_nang}</p>
            <p className="text-xs text-muted-foreground font-mono">{fn.ma_chuc_nang}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {tasks.length} {t('chucNangNhiemVu.taskCountLabel')}
          </span>
        </button>
        {onAddTask && (
          <Button type="button" size="sm" onClick={() => onAddTask(fn)} className="shrink-0 h-8 px-2.5 text-xs bg-primary text-white hover:bg-primary/90">
            <Plus size={12} className="mr-1" />
            {t('chucNangNhiemVu.addTask')}
          </Button>
        )}
      </div>

      {/* Cấp 2 + 3: Nhiệm vụ → KPI inline */}
      {expanded && (
        <div className="p-3 space-y-3 bg-background/50">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 px-2">{t('chucNangNhiemVu.emptyTasks')}</p>
          ) : (
            tasks.map((task) => (
              <TaskKpiBlock
                key={task.id}
                task={task}
                onAddKpi={() => onAddKpi(task)}
                onViewKpi={onViewKpi}
                onEditKpi={onEditKpi}
                onDeleteKpi={onDeleteKpi}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FunctionKpiSection;
