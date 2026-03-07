import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Power, Plus, Layers, ClipboardList, Eye } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { DeptFunction, Task, TaskResponsibleGroupCode } from '../core/types';

interface Props {
  fn: DeptFunction;
  tasks: Task[];
  onViewFunction?: (f: DeptFunction) => void;
  onEditFunction: (f: DeptFunction) => void;
  onDeleteFunction: (id: string) => void;
  onStatusChangeFunction: (f: DeptFunction) => void;
  onAddTask: (idChucNang: string) => void;
  onViewTask?: (t: Task) => void;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChangeTask: (t: Task) => void;
}

const FunctionWithTasksCard: React.FC<Props> = ({
  fn,
  tasks,
  onViewFunction,
  onEditFunction,
  onDeleteFunction,
  onStatusChangeFunction,
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onStatusChangeTask,
}) => {
  const { t } = useTranslation();

  const groupLabel = (code: TaskResponsibleGroupCode | null) =>
    code ? t(`chucNangNhiemVu.responsibleGroup.${code}`) : '--';

  const relatedGroupCodes = useMemo(
    () => [...new Set(tasks.map((t) => t.nhom_chiu_trach_nhiem).filter(Boolean))] as TaskResponsibleGroupCode[],
    [tasks]
  );

  const statusBadge = (status: number) =>
    status === 1 ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {t('chucNangNhiemVu.active')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('chucNangNhiemVu.inactive')}
      </span>
    );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Function header */}
      <div className="flex items-center justify-between gap-3 p-3 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Layers size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{fn.ten_chuc_nang}</p>
            <p className="text-xs text-muted-foreground font-mono">{fn.ma_chuc_nang}</p>
            {relatedGroupCodes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('chucNangNhiemVu.relatedGroups')}: {relatedGroupCodes.map(groupLabel).join(', ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onViewFunction && (
            <button
              type="button"
              onClick={() => onViewFunction(fn)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              aria-label={t('common.view')}
            >
              <Eye size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onStatusChangeFunction(fn)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-all"
            aria-label={t('common.status')}
          >
            <Power size={16} />
          </button>
          <button
            type="button"
            onClick={() => onEditFunction(fn)}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
            aria-label={t('common.edit')}
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDeleteFunction(fn.id)}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
            aria-label={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
          <Button size="sm" onClick={() => onAddTask(fn.id)} className="ml-1">
            <Plus size={14} className="mr-1.5" />
            {t('chucNangNhiemVu.addTask')}
          </Button>
        </div>
      </div>
      {/* Tasks sub-table */}
      <div className="overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('chucNangNhiemVu.emptyTasks')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-10">#</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t('chucNangNhiemVu.col.code')}</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t('chucNangNhiemVu.col.name')}</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[120px]">{t('chucNangNhiemVu.col.responsibleGroup')}</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-20">{t('chucNangNhiemVu.col.order')}</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-24">{t('chucNangNhiemVu.col.status')}</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground w-28">{t('chucNangNhiemVu.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => (
                <tr
                  key={task.id}
                  role={onViewTask ? 'button' : undefined}
                  tabIndex={onViewTask ? 0 : undefined}
                  onClick={onViewTask ? () => onViewTask(task) : undefined}
                  onKeyDown={onViewTask ? (e) => e.key === 'Enter' && onViewTask(task) : undefined}
                  className={`border-b border-border/50 hover:bg-muted/30 ${onViewTask ? 'cursor-pointer' : ''}`}
                >
                  <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList size={12} className="text-primary shrink-0" />
                      <span className="font-mono text-xs">{task.ma_nhiem_vu}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-medium text-foreground">{task.ten_nhiem_vu}</td>
                  <td className="py-2 px-3 text-muted-foreground">{groupLabel(task.nhom_chiu_trach_nhiem)}</td>
                  <td className="py-2 px-3">{task.thu_tu}</td>
                  <td className="py-2 px-3">{statusBadge(task.trang_thai)}</td>
                  <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      {onViewTask && (
                        <button
                          type="button"
                          onClick={() => onViewTask(task)}
                          className="p-1.5 rounded text-muted-foreground hover:bg-muted"
                          aria-label={t('common.view')}
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onStatusChangeTask(task)}
                        className="p-1.5 rounded text-muted-foreground hover:bg-muted"
                        aria-label={t('common.status')}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded"
                        aria-label={t('common.edit')}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FunctionWithTasksCard;
