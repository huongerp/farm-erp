import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Layers, Building2, Hash, FileText, Calendar, Power, ClipboardList, Eye, Plus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import EmptyState from '../../../../components/shared/EmptyState';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import type { DeptFunction, Task, TaskResponsibleGroupCode } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

/** Cấu hình cột bảng con nhiệm vụ (min/max theo quy định generic) */
const TASK_SUB_COLUMNS = [
  { id: 'stt', minWidth: 40, maxWidth: 56 },
  { id: 'code', minWidth: 100, maxWidth: 180 },
  { id: 'name', minWidth: 200, maxWidth: 360 },
  { id: 'responsible', minWidth: 100, maxWidth: 200 },
  { id: 'order', minWidth: 64, maxWidth: 80 },
  { id: 'status', minWidth: 96, maxWidth: 140 },
  { id: 'actions', minWidth: 96, maxWidth: 120 },
] as const;

interface Props {
  data: DeptFunction;
  departmentName?: string;
  tasks: Task[];
  onClose: () => void;
  onEdit: (f: DeptFunction) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (f: DeptFunction) => void;
  /** Callbacks cho bảng con nhiệm vụ (thêm / xem / sửa / xóa) */
  onAddTask?: () => void;
  onViewTask?: (t: Task) => void;
  onEditTask?: (t: Task) => void;
  onDeleteTask?: (id: string) => void;
}

const FunctionDetailDrawer: React.FC<Props> = ({
  data,
  departmentName,
  tasks,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;

  const groupLabel = (code: TaskResponsibleGroupCode | null) =>
    code ? t(`chucNangNhiemVu.responsibleGroup.${code}`) : '—';

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            onDelete(data.id);
            onClose();
          }}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('chucNangNhiemVu.functionDetailTitle')}
      subtitle={data.ma_chuc_nang}
      icon={<Layers size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Layers size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_chuc_nang}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_chuc_nang}</p>
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('chucNangNhiemVu.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('chucNangNhiemVu.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('chucNangNhiemVu.detailSectionInfo')} icon={<FileText size={14} />} variant="primary">
          <DetailFieldGrid cols={2}>
            <DetailField label={t('chucNangNhiemVu.form.functionCode')} value={data.ma_chuc_nang} icon={<Hash size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.functionName')} value={data.ten_chuc_nang} icon={<Layers size={12} />} />
            <DetailField label={t('chucNangNhiemVu.detailDepartment')} value={departmentName ?? '—'} icon={<Building2 size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.order')} value={String(data.thu_tu)} icon={<Hash size={12} />} />
            <DetailField label={t('chucNangNhiemVu.form.description')} value={data.mo_ta ?? '—'} icon={<FileText size={12} />} />
            <DetailField label={t('chucNangNhiemVu.detailUpdated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {onStatusChange && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(data)}
              className="text-muted-foreground"
            >
              <Power size={14} className="mr-1.5" />
              {isActive ? t('chucNangNhiemVu.deactivate') : t('chucNangNhiemVu.activate')}
            </Button>
          </div>
        )}

        {/* Bảng con nhiệm vụ (chuẩn generic như Phòng ban con) */}
        <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
            <div className="flex items-center gap-2 shrink-0">
              <ClipboardList size={14} className="text-primary" />
              <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                {t('chucNangNhiemVu.tasks')}
              </h4>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                {tasks.length} {t('chucNangNhiemVu.taskCountLabel')}
              </span>
            </div>
            <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
            {onAddTask && (
              <Button
                type="button"
                size="sm"
                onClick={onAddTask}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
              >
                <Plus size={14} className="mr-1.5" />
                {t('chucNangNhiemVu.addTask')}
              </Button>
            )}
          </div>
          {tasks.length === 0 ? (
            <EmptyState
              title={t('chucNangNhiemVu.emptyTasks')}
              description={t('chucNangNhiemVu.emptyTasksHint')}
              icon={<ClipboardList className="w-10 h-10 text-muted-foreground" />}
              action={
                onAddTask ? (
                  <Button type="button" size="sm" onClick={onAddTask} className="bg-primary text-white hover:bg-primary/90">
                    <Plus size={14} className="mr-2" />
                    {t('chucNangNhiemVu.addTask')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[0])}>#</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[1])}>{t('chucNangNhiemVu.col.code')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[2])}>{t('chucNangNhiemVu.col.name')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[3])}>{t('chucNangNhiemVu.col.responsibleGroup')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[4])}>{t('chucNangNhiemVu.col.order')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[5])}>{t('chucNangNhiemVu.col.status')}</th>
                      <th className="px-4 py-2 font-semibold text-foreground/80 text-xs text-center min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[6])}>{t('chucNangNhiemVu.col.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                    {tasks.map((task, idx) => (
                      <tr
                        key={task.id}
                        role={onViewTask ? 'button' : undefined}
                        tabIndex={onViewTask ? 0 : undefined}
                        onClick={onViewTask ? () => onViewTask(task) : undefined}
                        onKeyDown={onViewTask ? (e) => e.key === 'Enter' && onViewTask(task) : undefined}
                        className={`hover:bg-muted/60 transition-colors ${onViewTask ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[0])}>{idx + 1}</td>
                        <td className="px-4 py-2.5 min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[1])}>
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                            {task.ma_nhiem_vu}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-foreground min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[2])}>{task.ten_nhiem_vu}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[3])}>{groupLabel(task.nhom_chiu_trach_nhiem)}</td>
                        <td className="px-4 py-2.5 tabular-nums min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[4])}>{task.thu_tu}</td>
                        <td className="px-4 py-2.5 min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[5])}>
                          {task.trang_thai === 1 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {t('chucNangNhiemVu.active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              {t('chucNangNhiemVu.inactive')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center min-w-0" style={getColumnCellStyle(TASK_SUB_COLUMNS[6])} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-0.5">
                            {onViewTask && (
                              <button
                                type="button"
                                onClick={() => onViewTask(task)}
                                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-all"
                                title={t('common.view')}
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            {onEditTask && (
                              <button
                                type="button"
                                onClick={() => onEditTask(task)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                                title={t('common.edit')}
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {onDeleteTask && (
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                                title={t('common.delete')}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </GenericDrawer>
  );
};

export default FunctionDetailDrawer;
